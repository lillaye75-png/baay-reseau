from fastapi import APIRouter

from app.api.v1.endpoints import auth, tenants, products, customers, sales, dashboard, whatsapp, reports, storefront, shop, finance, variants, billing, loyalty, referral, settings, licences

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(variants.router, prefix="/products", tags=["variants"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(whatsapp.router, prefix="/whatsapp", tags=["whatsapp"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(storefront.router, prefix="/storefront", tags=["storefront"])
api_router.include_router(shop.router, prefix="/shop", tags=["shop"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(loyalty.router, prefix="/loyalty", tags=["loyalty"])
api_router.include_router(referral.router, prefix="/referral", tags=["referral"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(licences.router, prefix="/licences", tags=["licences"])
