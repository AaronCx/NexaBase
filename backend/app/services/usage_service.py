"""
Usage Tracking Service

Tracks per-user monthly AI message consumption and enforces tier limits.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.database import get_supabase
from app.models.schemas import TierEnum


def _tier_limit(tier: str) -> int:
    if tier == TierEnum.pro:
        return settings.PRO_TIER_MONTHLY_MESSAGES
    return settings.FREE_TIER_MONTHLY_MESSAGES


async def get_usage(user_id: str) -> dict:
    """Return current period usage for a user."""
    sb = get_supabase()

    # Get user profile (tier + usage)
    profile_res = (
        sb.table("profiles")
        .select("tier, messages_used_this_month, usage_period_start")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not profile_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    profile = profile_res.data
    tier = profile.get("tier", TierEnum.free)
    used = profile.get("messages_used_this_month", 0)
    limit = _tier_limit(tier)

    return {
        "messages_used": used,
        "messages_limit": limit,
        "messages_remaining": max(0, limit - used),
        "tier": tier,
    }


async def check_and_increment(user_id: str) -> dict:
    """
    Check if the user has quota remaining and increment their usage counter.
    Raises 429 if the quota is exhausted.
    Returns updated usage dict.
    """
    sb = get_supabase()

    # Fetch with optimistic lock via RPC to avoid race conditions
    rpc_res = sb.rpc(
        "increment_message_usage",
        {"p_user_id": user_id},
    ).execute()

    if not rpc_res.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track usage",
        )

    result = rpc_res.data
    if result.get("quota_exceeded"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Monthly message quota exceeded. Please upgrade to Pro.",
                "messages_used": result["messages_used"],
                "messages_limit": result["messages_limit"],
                "tier": result["tier"],
            },
        )

    return {
        "messages_used": result["messages_used"],
        "messages_limit": result["messages_limit"],
        "messages_remaining": result["messages_limit"] - result["messages_used"],
        "tier": result["tier"],
    }


async def reset_monthly_usage(user_id: str) -> None:
    """Reset usage counter (called by Stripe webhook on renewal)."""
    sb = get_supabase()
    sb.table("profiles").update(
        {
            "messages_used_this_month": 0,
            "usage_period_start": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", user_id).execute()


async def upgrade_tier(user_id: str, tier: str, stripe_customer_id: Optional[str] = None) -> None:
    """Update user's tier after successful Stripe subscription."""
    sb = get_supabase()
    update_data: dict = {"tier": tier}
    if stripe_customer_id:
        update_data["stripe_customer_id"] = stripe_customer_id
    sb.table("profiles").update(update_data).eq("id", user_id).execute()
