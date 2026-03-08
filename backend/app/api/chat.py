from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.core.security import get_current_user
from app.middleware.rate_limit import chat_limiter
from app.models.schemas import ChatRequest, ChatResponse
from app.services import langchain_service, usage_service

router = APIRouter(prefix="/chat", tags=["chat"])


def _check_rate_limit(user_id: str) -> None:
    allowed, remaining = chat_limiter.is_allowed(user_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait before sending more messages.",
        )


@router.post("", response_model=ChatResponse)
async def send_message(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    _check_rate_limit(user_id)

    # Check & increment usage (raises 429 if over quota)
    usage = await usage_service.check_and_increment(user_id)

    result = await langchain_service.chat(
        user_id=user_id,
        message=body.message,
        history=body.history or [],
        conversation_id=body.conversation_id,
    )

    return ChatResponse(
        reply=result["reply"],
        conversation_id=result["conversation_id"],
        tokens_used=result["tokens_used"],
        messages_used=usage["messages_used"],
        messages_limit=usage["messages_limit"],
    )


@router.post("/stream")
async def stream_message(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """SSE streaming endpoint."""
    user_id = current_user["id"]
    _check_rate_limit(user_id)

    # Check & increment usage
    await usage_service.check_and_increment(user_id)

    async def event_generator():
        async for token in langchain_service.chat_stream(
            user_id=user_id,
            message=body.message,
            history=body.history or [],
            conversation_id=body.conversation_id,
        ):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    conversations = await langchain_service.get_conversations(current_user["id"])
    return {"conversations": conversations}


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    messages = await langchain_service.get_conversation_messages(
        conversation_id, current_user["id"]
    )
    if messages is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return {"messages": messages}


@router.get("/usage")
async def get_usage(current_user: dict = Depends(get_current_user)):
    usage = await usage_service.get_usage(current_user["id"])
    return usage
