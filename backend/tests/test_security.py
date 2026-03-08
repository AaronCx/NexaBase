import pytest
from datetime import timedelta
from fastapi import HTTPException

from app.core.security import create_access_token, decode_token


def test_create_and_decode_token():
    data = {"sub": "user-123", "email": "test@example.com", "role": "authenticated"}
    token = create_access_token(data)
    decoded = decode_token(token)

    assert decoded["sub"] == "user-123"
    assert decoded["email"] == "test@example.com"
    assert decoded["role"] == "authenticated"
    assert "exp" in decoded


def test_token_with_custom_expiry():
    data = {"sub": "user-456"}
    token = create_access_token(data, expires_delta=timedelta(minutes=5))
    decoded = decode_token(token)
    assert decoded["sub"] == "user-456"


def test_invalid_token_raises():
    with pytest.raises(HTTPException) as exc_info:
        decode_token("invalid.token.here")
    assert exc_info.value.status_code == 401


def test_expired_token_raises():
    data = {"sub": "user-789"}
    token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    with pytest.raises(HTTPException) as exc_info:
        decode_token(token)
    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()
