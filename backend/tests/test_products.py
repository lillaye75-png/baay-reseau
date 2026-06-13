import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, auth_headers: dict):
    response = await client.post("/api/v1/products/", json={
        "name": "Test Product",
        "price_cfa": 15000,
        "cost_price_cfa": 10000,
        "stock_quantity": 50,
        "low_stock_threshold": 10,
        "unit": "piece",
        "sku": "TP-001",
        "barcode": "1234567890",
    }, headers=auth_headers)
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["name"] == "Test Product"
    assert data["price_cfa"] == 15000


@pytest.mark.asyncio
async def test_get_products(client: AsyncClient, auth_headers: dict):
    await client.post("/api/v1/products/", json={
        "name": "Product One",
        "price_cfa": 10000,
        "stock_quantity": 20,
    }, headers=auth_headers)
    
    response = await client.get("/api/v1/products/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_update_product(client: AsyncClient, auth_headers: dict):
    create_res = await client.post("/api/v1/products/", json={
        "name": "Update Test",
        "price_cfa": 5000,
        "stock_quantity": 10,
    }, headers=auth_headers)
    product_id = create_res.json()["id"]
    
    response = await client.put(f"/api/v1/products/{product_id}", json={
        "name": "Updated Product",
        "price_cfa": 7500,
        "stock_quantity": 15,
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Product"
    assert data["price_cfa"] == 7500


@pytest.mark.asyncio
async def test_delete_product(client: AsyncClient, auth_headers: dict):
    create_res = await client.post("/api/v1/products/", json={
        "name": "Delete Test",
        "price_cfa": 3000,
        "stock_quantity": 5,
    }, headers=auth_headers)
    product_id = create_res.json()["id"]
    
    response = await client.delete(f"/api/v1/products/{product_id}", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_product_by_barcode(client: AsyncClient, auth_headers: dict):
    await client.post("/api/v1/products/", json={
        "name": "Barcode Product",
        "price_cfa": 12000,
        "stock_quantity": 30,
        "barcode": "9876543210",
    }, headers=auth_headers)
    
    response = await client.get("/api/v1/products/barcode/9876543210", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Barcode Product"
