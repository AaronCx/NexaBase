"""
Stripe Billing Service
"""

import stripe
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.database import get_supabase

stripe.api_key = settings.STRIPE_SECRET_KEY


async def create_checkout_session(
    user_id: str,
    email: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
) -> dict:
    sb = get_supabase()

    # Get or create Stripe customer
    profile_res = (
        sb.table("profiles")
        .select("stripe_customer_id")
        .eq("id", user_id)
        .single()
        .execute()
    )
    customer_id = profile_res.data.get("stripe_customer_id") if profile_res.data else None

    if not customer_id:
        customer = stripe.Customer.create(
            email=email,
            metadata={"supabase_user_id": user_id},
        )
        customer_id = customer.id
        sb.table("profiles").update({"stripe_customer_id": customer_id}).eq(
            "id", user_id
        ).execute()

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user_id},
        subscription_data={
            "metadata": {"user_id": user_id},
        },
    )

    return {"checkout_url": session.url, "session_id": session.id}


async def create_portal_session(user_id: str, return_url: str) -> dict:
    sb = get_supabase()
    profile_res = (
        sb.table("profiles")
        .select("stripe_customer_id")
        .eq("id", user_id)
        .single()
        .execute()
    )
    customer_id = profile_res.data.get("stripe_customer_id") if profile_res.data else None

    if not customer_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Stripe customer found for this user",
        )

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return {"portal_url": session.url}


async def handle_webhook(payload: bytes, sig_header: str) -> dict:
    """Process Stripe webhook events."""
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook signature",
        )

    event_type = event["type"]
    data = event["data"]["object"]

    sb = get_supabase()

    if event_type == "checkout.session.completed":
        user_id = data.get("metadata", {}).get("user_id")
        if user_id:
            sb.table("profiles").update({"tier": "pro"}).eq("id", user_id).execute()

    elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
        customer_id = data.get("customer")
        sub_status = data.get("status")
        tier = "pro" if sub_status in ("active", "trialing") else "free"
        if customer_id:
            sb.table("profiles").update({"tier": tier}).eq(
                "stripe_customer_id", customer_id
            ).execute()

    elif event_type == "customer.subscription.deleted":
        customer_id = data.get("customer")
        if customer_id:
            sb.table("profiles").update({"tier": "free"}).eq(
                "stripe_customer_id", customer_id
            ).execute()

    elif event_type == "invoice.paid":
        # Reset monthly usage on successful renewal
        customer_id = data.get("customer")
        if customer_id:
            profile_res = (
                sb.table("profiles")
                .select("id")
                .eq("stripe_customer_id", customer_id)
                .single()
                .execute()
            )
            if profile_res.data:
                from app.services.usage_service import reset_monthly_usage
                await reset_monthly_usage(profile_res.data["id"])

    elif event_type == "invoice.payment_failed":
        customer_id = data.get("customer")
        if customer_id:
            sb.table("profiles").update({"tier": "free"}).eq(
                "stripe_customer_id", customer_id
            ).execute()

    return {"status": "processed", "event_type": event_type}


async def get_subscription_status(user_id: str) -> dict:
    sb = get_supabase()
    profile_res = (
        sb.table("profiles")
        .select("tier, stripe_customer_id")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not profile_res.data:
        return {"tier": "free", "status": "none"}

    profile = profile_res.data
    customer_id = profile.get("stripe_customer_id")

    if not customer_id:
        return {"tier": profile.get("tier", "free"), "status": "none"}

    subs = stripe.Subscription.list(customer=customer_id, limit=1)
    if not subs.data:
        return {"tier": profile.get("tier", "free"), "status": "none"}

    sub = subs.data[0]
    return {
        "tier": profile.get("tier", "free"),
        "status": sub.status,
        "current_period_end": sub.current_period_end,
        "cancel_at_period_end": sub.cancel_at_period_end,
    }
