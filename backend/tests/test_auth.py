import os
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.mongodb import scan_history_collection, users_collection

client = TestClient(app)

TEST_USER_EMAIL = "test@example.com"
DUP_USER_EMAIL = "duplicate@example.com"


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    test_emails = [TEST_USER_EMAIL, DUP_USER_EMAIL]
    users_collection.delete_many({"email": {"$in": test_emails}})
    yield
    # Cleanup after auth tests
    users_collection.delete_many({"email": {"$in": test_emails}})
    scan_history_collection.delete_many({"user_id": {"$exists": True}})


def test_successful_email_registration():
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": TEST_USER_EMAIL,
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == TEST_USER_EMAIL
    assert "id" in data
    assert "password_hash" not in data


def test_duplicate_email_registration_rejected():
    client.post("/api/auth/register", json={
        "name": "Dup User",
        "email": DUP_USER_EMAIL,
        "password": "password123",
    })
    response = client.post("/api/auth/register", json={
        "name": "Dup User 2",
        "email": DUP_USER_EMAIL,
        "password": "password123",
    })
    assert response.status_code == 400
    assert "already exists" in response.json().get("detail", "").lower()


def test_successful_password_login():
    response = client.post("/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": "password123",
    })
    assert response.status_code == 200
    assert "session_token" in response.cookies


def test_incorrect_password_rejected():
    response = client.post("/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": "wrongpassword",
    })
    assert response.status_code == 400


def test_missing_session_cannot_access_history():
    client.cookies.clear()
    response = client.get("/api/history")
    assert response.status_code == 401


def test_missing_session_cannot_access_stats():
    client.cookies.clear()
    response = client.get("/api/stats")
    assert response.status_code == 401


def test_missing_session_cannot_call_analyze():
    client.cookies.clear()
    response = client.post("/api/analyze", json={
        "text": "Check this text",
        "input_type": "message",
        "save_history": True,
        "mask_sensitive": True,
    })
    assert response.status_code == 401


def test_logout_invalidates_session():
    # Login first
    login_resp = client.post("/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": "password123",
    })
    assert login_resp.status_code == 200
    assert "session_token" in login_resp.cookies

    # Check me endpoint works
    me_resp = client.get("/api/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == TEST_USER_EMAIL

    # Logout
    logout_resp = client.post("/api/auth/logout")
    assert logout_resp.status_code == 200


def test_authenticated_scan_saves_and_populates_history():
    # Log in as normal test user
    login_resp = client.post("/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": "password123",
    })
    assert login_resp.status_code == 200

    # Clear previous history
    client.delete("/api/history")

    # Analyze content with history saved to MongoDB
    scan_resp = client.post("/api/analyze", json={
        "text": "Your account is temporarily suspended. Click here to verify: https://example.com",
        "input_type": "message",
        "save_history": True,
        "mask_sensitive": True,
    })
    assert scan_resp.status_code == 200
    scan_data = scan_resp.json()
    assert "trust_score" in scan_data
    assert "breakdown" in scan_data

    # Fetch history
    hist_resp = client.get("/api/history")
    assert hist_resp.status_code == 200
    history_items = hist_resp.json()
    assert len(history_items) >= 1
    item = history_items[0]

    # Verify all required schema fields are present
    required_fields = [
        "id", "created_at", "trust_score", "verdict", "category",
        "language", "original_text", "highlights", "explanation",
        "advice", "entities", "breakdown", "secondary_categories",
        "confidence", "claims_requiring_verification", "verification_status"
    ]
    for field in required_fields:
        assert field in item, f"Missing required field {field} in history item"

    # Fetch stats
    stats_resp = client.get("/api/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_scans"] >= 1
    assert "verdict_counts" in stats
    assert "category_counts" in stats
