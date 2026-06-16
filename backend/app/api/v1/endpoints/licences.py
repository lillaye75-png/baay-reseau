from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select, text, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta
import secrets
import string

from app.core.database import get_db
from app.api.deps import get_current_user, require_owner
from app.models.user import User
from app.models.tenant import Tenant
from app.models.licence import Licence, TIER_FEATURES, SUPER_ADMIN_PHONES
from app.core.security import hash_password

router = APIRouter()


def is_super_admin(user: User) -> bool:
    return user.phone in SUPER_ADMIN_PHONES


def generate_licence_key(tier: str) -> str:
    prefix_map = {"free": "BAY-F", "pro": "BAY-P", "enterprise": "BAY-E"}
    prefix = prefix_map.get(tier, "BAY-X")
    chars = string.ascii_uppercase + string.digits
    segment = "".join(secrets.choice(chars) for _ in range(4))
    return f"{prefix}-{segment}-{''.join(secrets.choice(chars) for _ in range(4))}-{''.join(secrets.choice(chars) for _ in range(4))}"


@router.get("/my")
async def get_my_licence(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Licence).where(Licence.assigned_to == user.tenant_id, Licence.is_active == True)
        .order_by(Licence.created_at.desc()).limit(1)
    )
    licence = result.scalar_one_or_none()

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()

    if licence and licence.expires_at:
        exp = licence.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            return {"licence": None, "expired": True, "expires_at": licence.expires_at.isoformat(), "tier": licence.tier}

    features = TIER_FEATURES.get(licence.tier if licence else "free", TIER_FEATURES["free"])

    return {
        "licence": {
            "id": licence.id if licence else None,
            "key": licence.licence_key if licence else None,
            "tier": licence.tier if licence else "free",
            "features": features,
            "expires_at": licence.expires_at.isoformat() if licence and licence.expires_at else None,
            "activated_at": licence.activated_at.isoformat() if licence and licence.activated_at else None,
        } if licence else None,
        "expired": False,
        "trial": not bool(licence) and tenant and not tenant.license_expires_at,
    }


@router.post("/activate")
async def activate_licence(data: dict, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    key = data.get("key", "").strip().upper()
    if not key:
        raise HTTPException(status_code=400, detail="Clé de licence requise")

    result = await db.execute(select(Licence).where(Licence.licence_key == key))
    licence = result.scalar_one_or_none()
    if not licence:
        raise HTTPException(status_code=404, detail="Licence introuvable")

    if not licence.is_active:
        raise HTTPException(status_code=400, detail="Cette licence a été désactivée")

    if licence.assigned_to and licence.assigned_to != user.tenant_id:
        raise HTTPException(status_code=403, detail="Cette licence est assignée à un autre compte")

    now = datetime.now(timezone.utc)
    licence.assigned_to = user.tenant_id
    licence.activated_at = now
    licence.expires_at = now + timedelta(days=licence.duration_days)
    licence.is_active = True

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if tenant:
        tenant.subscription_plan = licence.tier
        tenant.license_expires_at = licence.expires_at
        tenant.is_active = True

    await db.flush()
    return {"status": "activated", "tier": licence.tier, "expires_at": licence.expires_at.isoformat()}


@router.delete("/wipe-all")
async def wipe_all_data(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    tables = [
        "sale_items", "sales", "order_items", "orders",
        "product_images", "product_variants", "product_variant_options",
        "product_reviews", "loyalty_points", "credit_tab_entries",
        "credit_tabs", "products", "product_categories",
        "customers", "purchase_order_items", "purchase_orders",
        "suppliers", "expenses", "storefront_settings",
        "licences",
    ]
    for table in tables:
        try:
            await db.execute(text(f"DELETE FROM {table}"))
        except Exception:
            pass

    await db.execute(text("DELETE FROM users WHERE phone NOT IN ('776621410','708372127')"))
    await db.execute(text("DELETE FROM tenants WHERE id NOT IN (SELECT tenant_id FROM users WHERE phone IN ('776621410','708372127'))"))

    await db.flush()
    return {"status": "wiped", "message": "Toutes les données ont été supprimées"}


@router.get("/users")
async def list_all_users(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    users = list(result.scalars().all())

    user_list = []
    for u in users:
        tenant_result = await db.execute(select(Tenant).where(Tenant.id == u.tenant_id))
        tenant = tenant_result.scalar_one_or_none()
        user_list.append({
            "id": u.id,
            "name": u.name,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "tenant_id": u.tenant_id,
            "tenant_name": tenant.name if tenant else None,
            "tenant_active": tenant.is_active if tenant else None,
            "created_at": u.created_at.isoformat(),
        })
    return user_list


@router.post("/users", status_code=201)
async def create_user_admin(data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    phone = data.get("phone", "").strip()
    name = data.get("name", "").strip()
    password = data.get("password", "admin123")

    if not phone or not name:
        raise HTTPException(status_code=400, detail="phone et name requis")

    existing = await db.execute(select(User).where(User.phone == phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ce numéro existe déjà")

    tenant = Tenant(
        name=data.get("shop_name", name + " Shop"),
        slug=f"shop-{phone}",
        phone=phone,
        subscription_plan="free",
        license_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(tenant)
    await db.flush()

    new_user = User(
        tenant_id=tenant.id,
        name=name,
        phone=phone,
        password_hash=hash_password(password),
        role="owner",
    )
    db.add(new_user)
    await db.flush()

    return {"id": new_user.id, "name": name, "phone": phone, "tenant_id": tenant.id}


@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    target.is_active = not target.is_active
    await db.flush()
    return {"is_active": target.is_active, "name": target.name}


@router.delete("/users/{user_id}")
async def delete_user_admin(user_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    if target.phone in SUPER_ADMIN_PHONES:
        raise HTTPException(status_code=400, detail="Impossible de supprimer un super admin")

    target.is_active = False
    await db.flush()
    return {"status": "deactivated", "name": target.name}


@router.get("/tenants")
async def list_all_tenants(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Tenant).order_by(Tenant.created_at.desc()))
    tenants = list(result.scalars().all())

    tenant_list = []
    for t in tenants:
        users_result = await db.execute(select(func.count(User.id)).where(User.tenant_id == t.id))
        user_count = users_result.scalar()
        tenant_list.append({
            "id": t.id,
            "name": t.name,
            "slug": t.slug,
            "phone": t.phone,
            "subscription_plan": t.subscription_plan,
            "is_active": t.is_active,
            "wizard_completed": t.wizard_completed,
            "license_expires_at": t.license_expires_at.isoformat() if t.license_expires_at else None,
            "user_count": user_count,
            "created_at": t.created_at.isoformat(),
        })
    return tenant_list


@router.delete("/tenants/{tenant_id}")
async def delete_tenant_admin(tenant_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant non trouvé")

    users_result = await db.execute(select(User).where(User.tenant_id == tenant_id))
    for u in users_result.scalars().all():
        if u.phone not in SUPER_ADMIN_PHONES:
            await db.delete(u)

    await db.execute(text(f"DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE tenant_id = '{tenant_id}')"))
    await db.execute(text(f"DELETE FROM sales WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = '{tenant_id}')"))
    await db.execute(text(f"DELETE FROM orders WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE tenant_id = '{tenant_id}')"))
    await db.execute(text(f"DELETE FROM product_variants WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM product_variant_options WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM products WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM product_categories WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM customers WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM expenses WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM suppliers WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM licences WHERE assigned_to = '{tenant_id}'"))

    await db.delete(tenant)
    await db.flush()
    return {"status": "deleted", "name": tenant.name}


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    new_password = data.get("password", "admin123")
    target.password_hash = hash_password(new_password)
    await db.flush()
    return {"status": "reset", "name": target.name, "new_password": new_password}


@router.get("/stats")
async def get_admin_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    from app.models.product import Product
    from app.models.sale import Sale
    from app.models.customer import Customer
    from app.models.order import Order

    users_count = (await db.execute(select(func.count(User.id)))).scalar()
    tenants_count = (await db.execute(select(func.count(Tenant.id)))).scalar()
    active_tenants = (await db.execute(select(func.count(Tenant.id)).where(Tenant.is_active == True))).scalar()
    products_count = (await db.execute(select(func.count(Product.id)))).scalar()
    sales_count = (await db.execute(select(func.count(Sale.id)))).scalar()
    total_revenue = (await db.execute(select(func.coalesce(func.sum(Sale.total_cfa), 0)))).scalar()
    customers_count = (await db.execute(select(func.count(Customer.id)))).scalar()
    orders_count = (await db.execute(select(func.count(Order.id)))).scalar()
    licences_count = (await db.execute(select(func.count(Licence.id)))).scalar()
    active_licences = (await db.execute(select(func.count(Licence.id)).where(Licence.is_active == True))).scalar()

    return {
        "users": users_count,
        "tenants": tenants_count,
        "active_tenants": active_tenants,
        "products": products_count,
        "sales": sales_count,
        "total_revenue_cfa": int(total_revenue),
        "customers": customers_count,
        "orders": orders_count,
        "licences": licences_count,
        "active_licences": active_licences,
    }


@router.get("/all")
async def list_all_licences(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Licence).order_by(Licence.created_at.desc()))
    licences = result.scalars().all()
    return [{
        "id": l.id,
        "licence_key": l.licence_key,
        "tier": l.tier,
        "is_active": l.is_active,
        "assigned_to": l.assigned_to,
        "duration_days": l.duration_days,
        "expires_at": l.expires_at.isoformat() if l.expires_at else None,
        "activated_at": l.activated_at.isoformat() if l.activated_at else None,
        "created_at": l.created_at.isoformat(),
    } for l in licences]


@router.post("/generate")
async def generate_licence(data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    tier = data.get("tier", "free")
    duration_days = data.get("duration_days", 30)

    key = generate_licence_key(tier)
    licence = Licence(
        licence_key=key,
        tier=tier,
        duration_days=duration_days,
        created_by=user.id,
    )
    db.add(licence)
    await db.flush()
    return {"id": licence.id, "key": licence.licence_key, "tier": tier, "duration_days": duration_days}


@router.put("/{licence_id}/toggle")
async def toggle_licence(licence_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Licence).where(Licence.id == licence_id))
    licence = result.scalar_one_or_none()
    if not licence:
        raise HTTPException(status_code=404, detail="Licence introuvable")

    licence.is_active = not licence.is_active

    now = datetime.now(timezone.utc)

    if licence.assigned_to:
        tenant_result = await db.execute(select(Tenant).where(Tenant.id == licence.assigned_to))
        tenant = tenant_result.scalar_one_or_none()
        if tenant:
            if licence.is_active:
                tenant.is_active = True
                tenant.license_expires_at = now + timedelta(days=licence.duration_days)
            else:
                tenant.is_active = False
                tenant.license_expires_at = now - timedelta(seconds=10)

    await db.flush()
    return {"is_active": licence.is_active}


@router.delete("/{licence_id}")
async def delete_licence(licence_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Licence).where(Licence.id == licence_id))
    licence = result.scalar_one_or_none()
    if not licence:
        raise HTTPException(status_code=404, detail="Licence introuvable")

    if licence.assigned_to:
        tenant_result = await db.execute(select(Tenant).where(Tenant.id == licence.assigned_to))
        tenant = tenant_result.scalar_one_or_none()
        if tenant:
            tenant.license_expires_at = datetime.now(timezone.utc) - timedelta(seconds=10)
            tenant.is_active = False
            tenant.subscription_plan = "free"

    await db.delete(licence)
    await db.flush()
    return {"status": "deleted"}


@router.put("/{licence_id}/assign")
async def assign_licence(licence_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Licence).where(Licence.id == licence_id))
    licence = result.scalar_one_or_none()
    if not licence:
        raise HTTPException(status_code=404, detail="Licence introuvable")

    tenant_id = data.get("tenant_id")
    licence.assigned_to = tenant_id if tenant_id else None
    await db.flush()
    return {"assigned_to": licence.assigned_to}
