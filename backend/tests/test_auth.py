import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "phone": "779998888",
        "password": "test123456",
        "shop_name": "Boutique Test",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "phone": "779997777",
        "password": "test123456",
        "shop_name": "Login Test",
    })
    response = await client.post("/api/v1/auth/login", json={
        "phone": "779997777",
        "password": "test123456",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "phone": "779996666",
        "password": "test123456",
        "shop_name": "Wrong Pass Test",
    })
    response = await client.post("/api/v1/auth/login", json={
        "phone": "779996666",
        "password": "wrongpassword",
    })
    assert response.status_code == 401
