from fastapi import APIRouter, Depends, HTTPException, Request, status
from gotrue.errors import AuthApiError

from app.core.config import settings
from app.core.database import get_supabase
from app.core.security import create_access_token, get_current_user
from app.middleware.rate_limit import auth_limiter
from app.models.schemas import (
    TokenResponse,
    UserLogin,
    UserProfile,
    UserRegister,
    TierEnum,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _check_auth_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = auth_limiter.is_allowed(client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please try again later.",
        )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister, request: Request):
    _check_auth_rate_limit(request)
    sb = get_supabase()
    try:
        res = sb.auth.sign_up(
            {"email": body.email, "password": body.password}
        )
    except AuthApiError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    user = res.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Check your email for a confirmation link.",
        )

    # Create profile row
    sb.table("profiles").upsert(
        {
            "id": user.id,
            "email": body.email,
            "full_name": body.full_name,
            "tier": TierEnum.free,
            "messages_used_this_month": 0,
        }
    ).execute()

    token = create_access_token(
        {"sub": user.id, "email": body.email, "role": "authenticated"}
    )
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=body.email,
        tier=TierEnum.free,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, request: Request):
    _check_auth_rate_limit(request)
    sb = get_supabase()
    try:
        res = sb.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except AuthApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user = res.user
    session = res.session
    if not user or not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Fetch tier
    profile_res = (
        sb.table("profiles")
        .select("tier")
        .eq("id", user.id)
        .single()
        .execute()
    )
    tier = profile_res.data.get("tier", TierEnum.free) if profile_res.data else TierEnum.free

    token = create_access_token(
        {"sub": user.id, "email": user.email, "role": "authenticated"}
    )
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        tier=tier,
    )


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    sb = get_supabase()
    profile_res = (
        sb.table("profiles")
        .select("*")
        .eq("id", current_user["id"])
        .single()
        .execute()
    )

    if not profile_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    p = profile_res.data
    tier = p.get("tier", TierEnum.free)
    limit = (
        settings.PRO_TIER_MONTHLY_MESSAGES
        if tier == TierEnum.pro
        else settings.FREE_TIER_MONTHLY_MESSAGES
    )

    return UserProfile(
        id=p["id"],
        email=p.get("email", ""),
        full_name=p.get("full_name"),
        tier=tier,
        messages_used=p.get("messages_used_this_month", 0),
        messages_limit=limit,
        stripe_customer_id=p.get("stripe_customer_id"),
        created_at=p["created_at"],
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # Supabase server-side: invalidation is handled client-side or via Supabase session revocation
    return {"message": "Logged out successfully"}
