import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_public_products(client: AsyncClient, auth_headers: dict):
    await client.post("/api/v1/products/", json={
        "name": "Online Product",
        "price_cfa": 8000,
        "stock_quantity": 25,
        "is_online": True,
    }, headers=auth_headers)
    
    tenant_res = await client.get("/api/v1/tenants/me", headers=auth_headers)
    slug = tenant_res.json().get("slug", "shop-test")
    
    response = await client.get(f"/api/v1/shop/{slug}/products")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_storefront_settings(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/storefront/settings", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_create_order(client: AsyncClient, auth_headers: dict):
    product_res = await client.post("/api/v1/products/", json={
        "name": "Order Product",
        "price_cfa": 15000,
        "stock_quantity": 50,
        "is_online": True,
    }, headers=auth_headers)
    product_id = product_res.json()["id"]
    
    tenant_res = await client.get("/api/v1/tenants/me", headers=auth_headers)
    slug = tenant_res.json().get("slug", "shop-test")
    
    response = await client.post(f"/api/v1/shop/{slug}/orders", json={
        "items": [{"product_id": product_id, "quantity": 2, "unit_price_cfa": 15000}],
        "customer_name": "Walk-in Customer",
        "customer_phone": "775554444",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending"
