import pytest
from httpx import AsyncClient

import os
import time

TEST_PASSWORD = os.environ.get("TEST_PASSWORD", "test123")
_base = 770000000 + int(time.time()) % 86400


def _phone(n: int) -> str:
    return str(_base + n)


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "phone": _phone(1),
        "password": TEST_PASSWORD,
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["name"] == "Test User"


@pytest.mark.asyncio
async def test_register_duplicate_phone(client: AsyncClient):
    phone = _phone(2)
    await client.post("/api/v1/auth/register", json={
        "name": "Dup User",
        "phone": phone,
        "password": TEST_PASSWORD,
    })
    response = await client.post("/api/v1/auth/register", json={
        "name": "Dup User 2",
        "phone": phone,
        "password": "test456",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    phone = _phone(3)
    await client.post("/api/v1/auth/register", json={
        "name": "Login Test",
        "phone": phone,
        "password": TEST_PASSWORD,
    })
    response = await client.post("/api/v1/auth/login", json={
        "phone": phone,
        "password": TEST_PASSWORD,
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    phone = _phone(4)
    await client.post("/api/v1/auth/register", json={
        "name": "Wrong Pass",
        "phone": phone,
        "password": TEST_PASSWORD,
    })
    response = await client.post("/api/v1/auth/login", json={
        "phone": phone,
        "password": "wrongpass",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_password_validation(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "name": "Short Pass",
        "phone": _phone(5),
        "password": "123",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_tenant(client: AsyncClient):
    phone = _phone(6)
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Tenant Test",
        "phone": phone,
        "password": TEST_PASSWORD,
    })
    token = reg.json()["access_token"]
    response = await client.get("/api/v1/tenants/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["name"] == os.environ.get("DEFAULT_TENANT_NAME", "My Shop")


@pytest.mark.asyncio
async def test_update_tenant(client: AsyncClient):
    phone = _phone(7)
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Update Tenant",
        "phone": phone,
        "password": TEST_PASSWORD,
    })
    token = reg.json()["access_token"]
    tenant = (await client.get("/api/v1/tenants/me", headers={"Authorization": f"Bearer {token}"})).json()
    response = await client.put(
        f"/api/v1/tenants/{tenant['id']}",
        json={"name": "Updated Shop", "wizard_completed": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Shop"


@pytest.mark.asyncio
async def test_quick_sale(client: AsyncClient):
    phone = _phone(8)
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Quick Sale Test",
        "phone": phone,
        "password": TEST_PASSWORD,
    })
    token = reg.json()["access_token"]
    response = await client.post("/api/v1/sales/quick", json={
        "product_name": "Service recharge",
        "quantity": 1,
        "unit_price_cfa": 5000,
        "payment_method": "cash",
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201
    data = response.json()
    assert data["total_cfa"] == 5000
    assert data["payment_method"] == "cash"


@pytest.mark.asyncio
async def test_dashboard_summary(client: AsyncClient):
    phone = _phone(9)
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Dashboard Test",
        "phone": phone,
        "password": TEST_PASSWORD,
    })
    token = reg.json()["access_token"]
    response = await client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "inventory" in data
    assert "revenue" in data
