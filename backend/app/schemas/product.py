from pydantic import BaseModel
from datetime import datetime


class ProductCategoryCreate(BaseModel):
    name: str
    name_wo: str | None = None


class ProductCategoryRead(BaseModel):
    id: str
    name: str
    name_wo: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    sku: str | None = None
    description: str | None = None
    price_cfa: int
    cost_price_cfa: int = 0
    stock_quantity: int = 0
    low_stock_threshold: int = 5
    unit: str = "piece"
    barcode: str | None = None
    image_url: str | None = None
    category_id: str | None = None


class ProductRead(BaseModel):
    id: str
    tenant_id: str
    name: str
    sku: str | None
    price_cfa: int
    cost_price_cfa: int
    stock_quantity: int
    low_stock_threshold: int
    unit: str
    barcode: str | None
    image_url: str | None
    is_active: bool
    category_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
