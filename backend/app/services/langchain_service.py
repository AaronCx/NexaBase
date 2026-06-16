"""
LangChain / OpenAI Service

Provides a streaming-capable chat interface backed by LangChain and OpenAI.
"""

import uuid
from typing import AsyncIterator, List, Optional

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.core.database import get_supabase
from app.models.schemas import ChatMessage

SYSTEM_PROMPT = (
    "You are NexaBase Assistant, a helpful AI embedded in the NexaBase SaaS platform. "
    "Answer user questions clearly and concisely. "
    "If you do not know something, say so honestly."
)


def _build_lc_messages(
    history: List[ChatMessage], user_message: str
) -> list:
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for m in history:
        if m.role == "user":
            messages.append(HumanMessage(content=m.content))
        elif m.role == "assistant":
            messages.append(AIMessage(content=m.content))
    messages.append(HumanMessage(content=user_message))
    return messages


def get_llm(streaming: bool = False) -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        api_key=settings.OPENAI_API_KEY,
        temperature=0.7,
        streaming=streaming,
        # Emit token-usage metadata on the final streamed chunk.
        stream_usage=True,
    )


async def chat(
    user_id: str,
    message: str,
    history: List[ChatMessage],
    conversation_id: Optional[str] = None,
) -> dict:
    """Non-streaming chat completion. Returns reply + token usage."""
    llm = get_llm()
    lc_messages = _build_lc_messages(history, message)

    response = await llm.ainvoke(lc_messages)
    reply = response.text() if callable(getattr(response, "text", None)) else str(response.content)
    usage = response.usage_metadata or {}
    tokens_used = usage.get("total_tokens", 0)

    conv_id = conversation_id or str(uuid.uuid4())

    # Persist the exchange
    await _persist_messages(user_id, conv_id, message, reply)

    return {
        "reply": reply,
        "conversation_id": conv_id,
        "tokens_used": tokens_used,
    }


async def chat_stream(
    user_id: str,
    message: str,
    history: List[ChatMessage],
    conversation_id: Optional[str] = None,
) -> AsyncIterator[str]:
    """Streaming chat completion via Server-Sent Events."""
    llm = get_llm(streaming=True)
    lc_messages = _build_lc_messages(history, message)

    full_reply = []

    async for chunk in llm.astream(lc_messages):
        content = chunk.content
        if not content:
            continue
        # Content may be a string or a list of content blocks (v1 message format).
        if isinstance(content, str):
            token = content
        else:
            token = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )
        if token:
            full_reply.append(token)
            yield token

    conv_id = conversation_id or str(uuid.uuid4())
    await _persist_messages(user_id, conv_id, message, "".join(full_reply))


async def _persist_messages(
    user_id: str, conversation_id: str, user_msg: str, assistant_msg: str
) -> None:
    """Store conversation turns in Supabase."""
    sb = get_supabase()

    # Upsert conversation record
    sb.table("conversations").upsert(
        {
            "id": conversation_id,
            "user_id": user_id,
            "updated_at": "now()",
        },
        on_conflict="id",
    ).execute()

    # Insert both turns
    sb.table("messages").insert(
        [
            {
                "conversation_id": conversation_id,
                "role": "user",
                "content": user_msg,
            },
            {
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": assistant_msg,
            },
        ]
    ).execute()


async def get_conversations(user_id: str) -> list:
    """Return conversation summaries for a user."""
    sb = get_supabase()
    res = (
        sb.table("conversations")
        .select(
            "id, title, created_at, updated_at, messages(count)"
        )
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(50)
        .execute()
    )
    return res.data or []


async def get_conversation_messages(conversation_id: str, user_id: str) -> list:
    """Return messages for a specific conversation (ownership check included)."""
    sb = get_supabase()
    conv = (
        sb.table("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not conv.data:
        return []

    msgs = (
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    return msgs.data or []
