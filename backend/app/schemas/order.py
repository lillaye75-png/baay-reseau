from pydantic import BaseModel
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: str | None = None
    customer_address: str
    customer_notes: str | None = None
    items: list[OrderItemCreate]
    payment_method: str = "wave"
    delivery_method: str = "delivery"


class OrderItemRead(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity: int
    unit_price_cfa: int
    total_cfa: int

    model_config = {"from_attributes": True}


class OrderRead(BaseModel):
    id: str
    tenant_id: str
    customer_name: str
    customer_phone: str
    customer_email: str | None
    customer_address: str
    customer_notes: str | None
    total_cfa: int
    payment_method: str
    payment_reference: str | None
    status: str
    delivery_method: str
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead] = []

    model_config = {"from_attributes": True}


class StorefrontSettingsCreate(BaseModel):
    is_enabled: bool = False
    store_name: str | None = None
    store_description: str | None = None
    banner_url: str | None = None
    theme_color: str = "#ea580c"
    min_order_cfa: int = 0
    delivery_fee_cfa: int = 0
    accepts_wave: bool = True
    accepts_orange_money: bool = True
    accepts_cash_on_delivery: bool = True
    phone: str | None = None
    whatsapp: str | None = None


class StorefrontSettingsRead(BaseModel):
    id: str
    tenant_id: str
    is_enabled: bool
    store_name: str | None
    store_description: str | None
    banner_url: str | None
    theme_color: str
    currency: str
    min_order_cfa: int
    delivery_fee_cfa: int
    accepts_wave: bool
    accepts_orange_money: bool
    accepts_cash_on_delivery: bool
    phone: str | None
    whatsapp: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PublicProductRead(BaseModel):
    id: str
    name: str
    sku: str | None
    description: str | None
    price_cfa: int
    stock_quantity: int
    unit: str
    image_url: str | None
    category_name: str | None

    model_config = {"from_attributes": True}


class PublicStoreRead(BaseModel):
    tenant_id: str
    store_name: str
    store_description: str | None
    banner_url: str | None
    theme_color: str
    delivery_fee_cfa: int
    min_order_cfa: int
    accepts_wave: bool
    accepts_orange_money: bool
    accepts_cash_on_delivery: bool
    phone: str | None
    whatsapp: str | None
