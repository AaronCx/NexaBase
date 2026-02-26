from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TierEnum(str, Enum):
    free = "free"
    pro = "pro"


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    tier: TierEnum = TierEnum.free


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    tier: TierEnum
    messages_used: int
    messages_limit: int
    stripe_customer_id: Optional[str] = None
    created_at: datetime


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str
    tokens_used: int
    messages_used: int
    messages_limit: int


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int


# ── Billing ───────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class PortalRequest(BaseModel):
    return_url: str


class PortalResponse(BaseModel):
    portal_url: str


class SubscriptionStatus(BaseModel):
    tier: TierEnum
    status: str  # active, canceled, past_due, trialing
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False


# ── Usage ─────────────────────────────────────────────────────────────────────

class UsageStats(BaseModel):
    messages_used: int
    messages_limit: int
    messages_remaining: int
    tier: TierEnum
    period_start: datetime
    period_end: datetime
