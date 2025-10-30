from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200

    data = res.json()
    # Basic sanity checks
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure clean start
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in activities[activity]["participants"]

    # Unregister
    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    assert email not in activities[activity]["participants"]


def test_unregister_nonexistent_participant():
    activity = "Chess Club"
    email = "noone@example.com"

    # make sure email not registered
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 404


def test_signup_activity_not_found():
    res = client.post("/activities/NoSuchActivity/signup?email=a@b.com")
    assert res.status_code == 404