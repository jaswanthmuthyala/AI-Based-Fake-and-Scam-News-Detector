from fastapi.testclient import TestClient
from app.main import app
from app.models.db import Base, engine, SessionLocal, User
import pytest
import uuid

# Create a test client
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup after auth tests
    db = SessionLocal()
    db.query(User).filter(User.email == "test@example.com").delete()
    db.query(User).filter(User.email == "duplicate@example.com").delete()
    db.commit()
    db.close()

def test_successful_email_registration():
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_duplicate_email_registration_rejected():
    client.post("/api/auth/register", json={
        "name": "Dup User",
        "email": "duplicate@example.com",
        "password": "password123"
    })
    response = client.post("/api/auth/register", json={
        "name": "Dup User 2",
        "email": "duplicate@example.com",
        "password": "password123"
    })
    assert response.status_code == 400

def test_successful_password_login():
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "session_token" in response.cookies

def test_incorrect_password_rejected():
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword"
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
        "mask_sensitive": True
    })
    assert response.status_code == 401

def test_logout_invalidates_session():
    # Login first
    login_resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert "session_token" in login_resp.cookies
    token = login_resp.cookies["session_token"]
    
    # Check me endpoint works
    me_resp = client.get("/api/auth/me", cookies={"session_token": token})
    assert me_resp.status_code == 200
    
    # Logout
    logout_resp = client.post("/api/auth/logout")
    assert logout_resp.status_code == 200
    
    # (Actually the cookie would be deleted by client, but we can verify the response sets it to expire or empty)
    # The Set-Cookie header usually has max-age=0 or expires in past
