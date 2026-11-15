import json
import os

# Use a throwaway DB file for the smoke test so re-runs are clean
os.environ["DATABASE_URL"] = "sqlite:////tmp/smoke_test.db"
if os.path.exists("/tmp/smoke_test.db"):
    os.remove("/tmp/smoke_test.db")

from app import create_app  # noqa: E402


def main():
    app = create_app()
    client = app.test_client()

    # health check
    r = client.get("/api/health")
    assert r.status_code == 200, r.get_data(as_text=True)

    # register a normal user
    r = client.post(
        "/api/auth/register",
        json={"name": "Ayesha Khan", "email": "ayesha@example.com", "password": "secret123"},
    )
    assert r.status_code == 201, r.get_data(as_text=True)
    user_token = r.get_json()["token"]
    print("register user ->", r.status_code)

    # login as seeded admin
    r = client.post(
        "/api/auth/login",
        json={"email": "admin@helpdesk.local", "password": "Admin@123"},
    )
    assert r.status_code == 200, r.get_data(as_text=True)
    admin_token = r.get_json()["token"]
    print("login admin ->", r.status_code)

    # user creates a ticket
    r = client.post(
        "/api/tickets",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "subject": "Cannot reset password",
            "description": "The reset link expires instantly.",
            "category": "account",
            "priority": "high",
        },
    )
    assert r.status_code == 201, r.get_data(as_text=True)
    ticket = r.get_json()["ticket"]
    print("create ticket ->", ticket["ticket_number"], ticket["status"])

    # user lists own tickets
    r = client.get("/api/tickets", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200 and len(r.get_json()["tickets"]) == 1
    print("list own tickets -> 1 ticket found")

    # a non-admin cannot hit the admin endpoint
    r = client.get("/api/admin/tickets", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 403, r.get_data(as_text=True)
    print("user blocked from admin endpoint -> 403 as expected")

    # admin sees it in the global queue and moves it to in_progress
    r = client.get("/api/admin/tickets", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200 and len(r.get_json()["tickets"]) == 1
    print("admin lists all tickets -> 1 ticket found")

    r = client.patch(
        f"/api/admin/tickets/{ticket['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "in_progress"},
    )
    assert r.status_code == 200, r.get_data(as_text=True)
    assert r.get_json()["ticket"]["status"] == "in_progress"
    print("admin updates status -> in_progress")

    # user fetches the ticket and should see the status-change comment
    r = client.get(f"/api/tickets/{ticket['id']}", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    detail = r.get_json()["ticket"]
    assert detail["status"] == "in_progress"
    assert any("in_progress" in c["body"] for c in detail["comments"])
    print("user sees updated status + timeline entry ->", detail["status"])

    # admin stats
    r = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    print("admin stats ->", json.dumps(r.get_json()["stats"]))

    print("\nALL SMOKE TESTS PASSED")


if __name__ == "__main__":
    main()
