from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.sale import Sale
from app.schemas.customer import CustomerCreate, CustomerRead

router = APIRouter()


@router.get("/", response_model=list[CustomerRead])
async def list_customers(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer).where(Customer.tenant_id == user.tenant_id)
    )
    return list(result.scalars().all())


@router.post("/", response_model=CustomerRead, status_code=201)
async def create_customer(data: CustomerCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    customer = Customer(tenant_id=user.tenant_id, **data.model_dump())
    db.add(customer)
    await db.flush()
    return customer


@router.get("/credit-debtors/", response_model=list[CustomerRead])
async def list_credit_debtors(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer).where(
            Customer.tenant_id == user.tenant_id,
            Customer.total_credit_cfa > 0,
        )
    )
    return list(result.scalars().all())


@router.get("/{customer_id}", response_model=CustomerRead)
async def get_customer(customer_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == user.tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerRead)
async def update_customer(customer_id: str, data: CustomerCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == user.tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in data.model_dump().items():
        setattr(customer, field, value)
    await db.flush()
    return customer


@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == user.tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.delete(customer)
    await db.flush()
    return {"status": "deleted"}


@router.post("/{customer_id}/pay-credit")
async def pay_credit(customer_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.sales import pay_credit as pay_credit_svc
    try:
        result = await pay_credit_svc(
            db, user.tenant_id, customer_id,
            amount=data.get("amount", 0),
            description=data.get("description"),
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{customer_id}/purchases")
async def get_customer_purchases(customer_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == user.tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    sales_result = await db.execute(
        select(Sale)
        .where(Sale.customer_id == customer_id, Sale.tenant_id == user.tenant_id)
        .order_by(Sale.created_at.desc())
        .options(selectinload(Sale.items))
    )
    sales = list(sales_result.scalars().all())

    total_spent = sum(s.total_cfa for s in sales)
    total_credit = sum(s.total_cfa for s in sales if s.is_credit)
    total_paid = total_spent - total_credit

    return {
        "customer": CustomerRead.model_validate(customer),
        "sales": [{"id": s.id, "total_cfa": s.total_cfa, "payment_method": s.payment_method, "is_credit": s.is_credit, "created_at": s.created_at, "items": [{"product_id": i.product_id, "quantity": i.quantity, "unit_price_cfa": i.unit_price_cfa, "total_cfa": i.total_cfa} for i in s.items]} for s in sales],
        "stats": {
            "total_purchases": len(sales),
            "total_spent_cfa": total_spent,
            "total_credit_cfa": total_credit,
            "total_paid_cfa": total_paid,
        },
    }
