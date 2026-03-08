def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "NexaBase"
    assert "services" in data
    assert "supabase" in data["services"]
    assert "openai" in data["services"]
    assert "stripe" in data["services"]


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "NexaBase" in data["message"]
