import pytest
from pydantic import ValidationError
from app.models.schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    ChatRequest,
    TierEnum,
)


def test_user_register_valid():
    user = UserRegister(email="test@example.com", password="securepass123")
    assert user.email == "test@example.com"
    assert user.full_name is None


def test_user_register_with_name():
    user = UserRegister(
        email="test@example.com", password="pass", full_name="Jane Doe"
    )
    assert user.full_name == "Jane Doe"


def test_user_register_invalid_email():
    with pytest.raises(ValidationError):
        UserRegister(email="not-an-email", password="pass")


def test_user_login_valid():
    login = UserLogin(email="user@test.com", password="password")
    assert login.email == "user@test.com"


def test_token_response():
    resp = TokenResponse(
        access_token="abc.def.ghi",
        user_id="user-1",
        email="a@b.com",
        tier=TierEnum.free,
    )
    assert resp.token_type == "bearer"
    assert resp.tier == TierEnum.free


def test_chat_request_defaults():
    req = ChatRequest(message="Hello")
    assert req.conversation_id is None
    assert req.history == []


def test_chat_request_with_history():
    req = ChatRequest(
        message="Hello",
        conversation_id="conv-1",
        history=[{"role": "user", "content": "Hi"}],
    )
    assert len(req.history) == 1


def test_tier_enum():
    assert TierEnum.free == "free"
    assert TierEnum.pro == "pro"
