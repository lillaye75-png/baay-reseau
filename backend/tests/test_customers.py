import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_customer(client: AsyncClient, auth_headers: dict):
    response = await client.post("/api/v1/customers/", json={
        "name": "Mamadou Diallo",
        "phone": "776665555",
        "nickname": "Mamadou",
    }, headers=auth_headers)
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["name"] == "Mamadou Diallo"
    assert data["phone"] == "776665555"


@pytest.mark.asyncio
async def test_get_customers(client: AsyncClient, auth_headers: dict):
    await client.post("/api/v1/customers/", json={
        "name": "Test Customer",
        "phone": "774443333",
    }, headers=auth_headers)
    
    response = await client.get("/api/v1/customers/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_update_customer(client: AsyncClient, auth_headers: dict):
    create_res = await client.post("/api/v1/customers/", json={
        "name": "Update Customer",
        "phone": "772221111",
    }, headers=auth_headers)
    customer_id = create_res.json()["id"]
    
    response = await client.put(f"/api/v1/customers/{customer_id}", json={
        "name": "Updated Customer",
        "nickname": "Updated",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Customer"
    assert data["nickname"] == "Updated"


@pytest.mark.asyncio
async def test_delete_customer(client: AsyncClient, auth_headers: dict):
    create_res = await client.post("/api/v1/customers/", json={
        "name": "Delete Customer",
        "phone": "770009999",
    }, headers=auth_headers)
    customer_id = create_res.json()["id"]
    
    response = await client.delete(f"/api/v1/customers/{customer_id}", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_customer_credit_balance(client: AsyncClient, auth_headers: dict):
    customer_res = await client.post("/api/v1/customers/", json={
        "name": "Credit Customer",
        "phone": "778887777",
    }, headers=auth_headers)
    customer_id = customer_res.json()["id"]
    
    product_res = await client.post("/api/v1/products/", json={
        "name": "Credit Product",
        "price_cfa": 25000,
        "stock_quantity": 10,
    }, headers=auth_headers)
    product_id = product_res.json()["id"]
    
    await client.post("/api/v1/sales/", json={
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "quantity": 1, "unit_price_cfa": 25000}],
        "payment_method": "credit",
        "is_credit": True,
    }, headers=auth_headers)
    
    customer_res = await client.get(f"/api/v1/customers/{customer_id}", headers=auth_headers)
    assert customer_res.json()["total_credit_cfa"] == 25000
