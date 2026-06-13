from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.user import UserCreate, UserLogin, UserRead, Token
from app.api.deps import require_owner

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.phone == data.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    tenant = Tenant(name="My Shop", slug=f"shop-{data.phone}", phone=data.phone)
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
        role="employee",
    )
    db.add(employee)
    await db.flush()
    return employee


@router.get("/employees", response_model=list[UserRead])
async def list_employees(user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.tenant_id == user.tenant_id, User.role == "employee")
    )
    return list(result.scalars().all())


@router.delete("/employees/{employee_id}")
async def remove_employee(employee_id: str, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.id == employee_id, User.tenant_id == user.tenant_id, User.role == "employee")
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee.is_active = False
    await db.flush()
    return {"status": "deactivated"}
