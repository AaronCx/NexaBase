"""
LangChain / OpenAI Service

Provides a streaming-capable chat interface backed by LangChain and OpenAI.
"""

import uuid
from typing import AsyncIterator, List, Optional

from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.schema import AIMessage, HumanMessage, SystemMessage
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


def get_llm(streaming: bool = False, callbacks=None) -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
        temperature=0.7,
        streaming=streaming,
        callbacks=callbacks or [],
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

    response = await llm.agenerate([lc_messages])
    generation = response.generations[0][0]
    reply = generation.text
    token_info = response.llm_output or {}
    tokens_used = token_info.get("token_usage", {}).get("total_tokens", 0)

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
    handler = AsyncIteratorCallbackHandler()
    llm = get_llm(streaming=True, callbacks=[handler])
    lc_messages = _build_lc_messages(history, message)

    import asyncio

    full_reply = []

    async def _run():
        await llm.agenerate([lc_messages])

    task = asyncio.create_task(_run())

    async for token in handler.aiter():
        full_reply.append(token)
        yield token

    await task

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
