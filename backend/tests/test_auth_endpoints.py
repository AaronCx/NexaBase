def test_protected_route_without_token(client):
    """Endpoints requiring auth should reject requests with no token.

    FastAPI's HTTPBearer returns 401 Unauthorized when the Authorization
    header is missing (it previously returned 403; corrected upstream).
    """
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_protected_route_with_invalid_token(client):
    """Endpoints requiring auth should return 401 with an invalid token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401


def test_logout_requires_auth(client):
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 401
