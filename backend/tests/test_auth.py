import pytest
from httpx import AsyncClient

import os
import time

TEST_PASSWORD = os.environ.get("TEST_PASSWORD", "test123456")
_base = 779990000 + int(time.time()) % 86400


def _phone(n: int) -> str:
    return str(_base + n)


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "name": "Register Test",
        "phone": _phone(1),
        "password": TEST_PASSWORD,
    })
    assert response.status_code in (200, 201)
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    phone = _phone(2)
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
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    phone = _phone(3)
    await client.post("/api/v1/auth/register", json={
        "name": "Wrong Pass Test",
        "phone": phone,
        "password": TEST_PASSWORD,
    })
    response = await client.post("/api/v1/auth/login", json={
        "phone": phone,
        "password": "wrongpassword",
    })
    assert response.status_code == 401
