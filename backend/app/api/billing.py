from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from app.core.security import get_current_user
from app.models.schemas import (
    CheckoutRequest,
    CheckoutResponse,
    PortalRequest,
    PortalResponse,
    SubscriptionStatus,
)
from app.services import stripe_service

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    body: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await stripe_service.create_checkout_session(
        user_id=current_user["id"],
        email=current_user["email"],
        price_id=body.price_id,
        success_url=body.success_url,
        cancel_url=body.cancel_url,
    )
    return CheckoutResponse(**result)


@router.post("/portal", response_model=PortalResponse)
async def create_portal(
    body: PortalRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await stripe_service.create_portal_session(
        user_id=current_user["id"],
        return_url=body.return_url,
    )
    return PortalResponse(**result)


@router.get("/subscription", response_model=SubscriptionStatus)
async def get_subscription(current_user: dict = Depends(get_current_user)):
    result = await stripe_service.get_subscription_status(current_user["id"])
    return SubscriptionStatus(**result)


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header",
        )
    payload = await request.body()
    result = await stripe_service.handle_webhook(payload, stripe_signature)
    return result
