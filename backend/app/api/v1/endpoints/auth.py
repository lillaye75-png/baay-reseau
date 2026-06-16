from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.user import UserCreate, UserLogin, UserRead, Token, EmployeeUpdate
from app.api.deps import require_owner

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.phone == data.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    tenant = Tenant(
        name="My Shop",
        slug=f"shop-{data.phone}",
        phone=data.phone,
        subscription_plan="free",
        license_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(tenant)
    await db.flush()

    user = User(
        tenant_id=tenant.id,
        name=data.name,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role="owner",
    )
    db.add(user)
    await db.flush()

    token = create_access_token(data={"sub": str(user.id), "tenant_id": str(tenant.id)})
    return Token(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == data.phone))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé. Contactez l'administrateur.")

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if tenant and not tenant.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé. Contactez l'administrateur.")

    token = create_access_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
    return Token(access_token=token, user=UserRead.model_validate(user))


@router.post("/invite-employee", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def invite_employee(data: UserCreate, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.phone == data.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    employee = User(
        tenant_id=user.tenant_id,
        name=data.name,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=data.role if data.role in ("employee", "manager") else "employee",
    )
    db.add(employee)
    await db.flush()
    return employee


@router.get("/employees", response_model=list[UserRead])
async def list_employees(user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.tenant_id == user.tenant_id, User.role != "owner")
    )
    return list(result.scalars().all())


@router.put("/employees/{employee_id}", response_model=UserRead)
async def update_employee(employee_id: str, data: EmployeeUpdate, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.id == employee_id, User.tenant_id == user.tenant_id, User.role != "owner")
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    await db.flush()
    return employee


@router.put("/employees/{employee_id}/toggle-active")
async def toggle_employee_active(employee_id: str, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.id == employee_id, User.tenant_id == user.tenant_id, User.role != "owner")
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee.is_active = not employee.is_active
    await db.flush()
    return {"is_active": employee.is_active, "name": employee.name}


@router.delete("/employees/{employee_id}")
async def remove_employee(employee_id: str, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.id == employee_id, User.tenant_id == user.tenant_id, User.role != "owner")
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee.is_active = False
    await db.flush()
    return {"status": "deactivated"}
