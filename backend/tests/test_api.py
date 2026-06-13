import pytest


@pytest.mark.anyio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.anyio
async def test_register_and_login(client):
    resp = await client.post("/api/v1/auth/register", json={
        "name": "Test Shop",
        "phone": "770000002",
        "password": "testpass123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["name"] == "Test Shop"

    resp = await client.post("/api/v1/auth/login", json={
        "phone": "770000002",
        "password": "testpass123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.anyio
async def test_login_wrong_password(client):
    await client.post("/api/v1/auth/register", json={
        "name": "Test",
        "phone": "770000003",
        "password": "pass123",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "phone": "770000003",
        "password": "wrong",
    })
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_duplicate_register(client):
    await client.post("/api/v1/auth/register", json={
        "name": "Dup",
        "phone": "770000004",
        "password": "pass",
    })
    resp = await client.post("/api/v1/auth/register", json={
        "name": "Dup2",
        "phone": "770000004",
        "password": "pass",
    })
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_protected_endpoint_no_auth(client):
    resp = await client.get("/api/v1/products/")
    assert resp.status_code in [401, 403]


@pytest.mark.anyio
async def test_create_and_list_products(client, auth_headers):
    resp = await client.post("/api/v1/products/", json={
        "name": "Test Product",
        "price_cfa": 5000,
        "cost_price_cfa": 3000,
        "stock_quantity": 10,
    }, headers=auth_headers)
    assert resp.status_code == 201
    product_id = resp.json()["id"]

    resp = await client.get("/api/v1/products/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    resp = await client.delete(f"/api/v1/products/{product_id}", headers=auth_headers)
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_create_and_list_customers(client, auth_headers):
    resp = await client.post("/api/v1/customers/", json={
        "name": "Test Customer",
        "phone": "779990001",
    }, headers=auth_headers)
    assert resp.status_code == 201

    resp = await client.get("/api/v1/customers/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.anyio
async def test_sale_creates_and_updates_stock(client, auth_headers):
    prod = await client.post("/api/v1/products/", json={
        "name": "Sale Test",
        "price_cfa": 1000,
        "stock_quantity": 10,
    }, headers=auth_headers)
    pid = prod.json()["id"]

    resp = await client.post("/api/v1/sales/", json={
        "items": [{"product_id": pid, "quantity": 3, "unit_price_cfa": 1000}],
        "payment_method": "cash",
    }, headers=auth_headers)
    assert resp.status_code == 201

    prod_resp = await client.get(f"/api/v1/products/{pid}", headers=auth_headers)
    assert prod_resp.json()["stock_quantity"] == 7


@pytest.mark.anyio
async def test_credit_sale_updates_customer(client, auth_headers):
    cust = await client.post("/api/v1/customers/", json={
        "name": "Credit Guy",
        "phone": "779990002",
    }, headers=auth_headers)
    cid = cust.json()["id"]

    prod = await client.post("/api/v1/products/", json={
        "name": "Credit Prod",
        "price_cfa": 2000,
        "stock_quantity": 5,
    }, headers=auth_headers)
    pid = prod.json()["id"]

    resp = await client.post("/api/v1/sales/", json={
        "customer_id": cid,
        "items": [{"product_id": pid, "quantity": 1, "unit_price_cfa": 2000}],
        "payment_method": "credit",
        "is_credit": True,
    }, headers=auth_headers)
    assert resp.status_code == 201

    cust_resp = await client.get(f"/api/v1/customers/{cid}", headers=auth_headers)
    assert cust_resp.json()["total_credit_cfa"] == 2000


@pytest.mark.anyio
async def test_dashboard_summary(client, auth_headers):
    resp = await client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "inventory" in data
    assert "revenue" in data
    assert "credit" in data


@pytest.mark.anyio
async def test_storefront_settings(client, auth_headers):
    resp = await client.get("/api/v1/storefront/settings", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.put("/api/v1/storefront/settings", json={
        "is_enabled": True,
        "store_name": "Test Store",
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["is_enabled"] == True
