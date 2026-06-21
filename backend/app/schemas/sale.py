from pydantic import BaseModel, model_validator
from datetime import datetime


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price_cfa: int


class SaleCreate(BaseModel):
    customer_id: str | None = None
    items: list[SaleItemCreate]
    payment_method: str = "cash"
    payment_reference: str | None = None
    is_credit: bool = False
    store_id: str | None = None


class QuickSaleCreate(BaseModel):
    customer_id: str | None = None
    product_name: str
    quantity: int = 1
    unit_price_cfa: int
    payment_method: str = "cash"
    payment_reference: str | None = None
    is_credit: bool = False


class SaleItemRead(BaseModel):
    id: str
    product_id: str
    product_name: str = ""
    quantity: int
    unit_price_cfa: int
    total_cfa: int

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def resolve_product_name(cls, data):
        if hasattr(data, "product") and data.product is not None:
            try:
                data.product_name = data.product.name
            except Exception:
                pass
        elif hasattr(data, "__dict__"):
            product = getattr(data, "product", None)
            if product and hasattr(product, "name"):
                data.product_name = product.name
        if isinstance(data, dict):
            product = data.get("product")
            if product and isinstance(product, dict) and "name" in product:
                data["product_name"] = product["name"]
        return data


class CustomerRead(BaseModel):
    id: str
    name: str
    phone: str | None = None
    nickname: str | None = None

    model_config = {"from_attributes": True}


class SaleRead(BaseModel):
    id: str
    tenant_id: str
    store_id: str | None = None
    user_id: str | None = None
    customer_id: str | None
    customer: CustomerRead | None = None
    total_cfa: int
    payment_method: str
    payment_reference: str | None
    is_credit: bool
    created_at: datetime
    items: list[SaleItemRead]

    model_config = {"from_attributes": True}
