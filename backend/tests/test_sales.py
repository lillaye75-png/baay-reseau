import pytest
from httpx import AsyncClient


@pytest.fixture
async def test_product(client: AsyncClient, auth_headers: dict):
    res = await client.post("/api/v1/products/", json={
        "name": "Sale Test Product",
        "price_cfa": 10000,
        "cost_price_cfa": 7000,
        "stock_quantity": 100,
    }, headers=auth_headers)
    return res.json()


@pytest.mark.asyncio
async def test_create_sale(client: AsyncClient, auth_headers: dict, test_product: dict):
    response = await client.post("/api/v1/sales/", json={
        "items": [
            {
                "product_id": test_product["id"],
                "quantity": 2,
                "unit_price_cfa": 10000,
            }
        ],
        "payment_method": "cash",
        "is_credit": False,
    }, headers=auth_headers)
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["total_cfa"] == 20000


@pytest.mark.asyncio
async def test_create_sale_decrements_stock(client: AsyncClient, auth_headers: dict, test_product: dict):
    initial_stock = test_product["stock_quantity"]
    
    await client.post("/api/v1/sales/", json={
        "items": [
            {
                "product_id": test_product["id"],
                "quantity": 3,
                "unit_price_cfa": 10000,
            }
        ],
        "payment_method": "cash",
    }, headers=auth_headers)
    
    product_res = await client.get(f"/api/v1/products/{test_product['id']}", headers=auth_headers)
    assert product_res.json()["stock_quantity"] == initial_stock - 3


@pytest.mark.asyncio
async def test_get_sales(client: AsyncClient, auth_headers: dict, test_product: dict):
    await client.post("/api/v1/sales/", json={
        "items": [{"product_id": test_product["id"], "quantity": 1, "unit_price_cfa": 10000}],
        "payment_method": "cash",
    }, headers=auth_headers)
    
    response = await client.get("/api/v1/sales/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_credit_sale(client: AsyncClient, auth_headers: dict, test_product: dict):
    customer_res = await client.post("/api/v1/customers/", json={
        "name": "Credit Customer",
        "phone": "778889999",
    }, headers=auth_headers)
    customer_id = customer_res.json()["id"]
    
    response = await client.post("/api/v1/sales/", json={
        "customer_id": customer_id,
        "items": [{"product_id": test_product["id"], "quantity": 1, "unit_price_cfa": 10000}],
        "payment_method": "credit",
        "is_credit": True,
    }, headers=auth_headers)
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["is_credit"] == True
