import os
import pytest
from fastapi.testclient import TestClient

# Set test env vars before importing app
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("OPENAI_API_KEY", "sk-test")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_fake")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test")
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost:3000"]')


@pytest.fixture()
def client():
    """Create a test client with fresh app instance."""
    from app.main import app

    with TestClient(app) as c:
        yield c
