from fastapi import APIRouter, Header, HTTPException, Depends

from app.core.config import settings
from app.services.scheduled_tasks import check_low_stock, send_daily_summary, check_credit_reminders

router = APIRouter()


async def _verify_cron(x_cron_secret: str = Header(default="", alias="x-cron-secret")):
    if settings.CRON_SECRET and x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid cron secret")
    return True


@router.post("/cron/daily-summary")
async def run_daily_summary(_: bool = Depends(_verify_cron)):  # noqa: F821
    await send_daily_summary()
    return {"ok": True, "task": "daily_summary"}


@router.post("/cron/low-stock")
async def run_low_stock(_: bool = Depends(_verify_cron)):  # noqa: F821
    await check_low_stock()
    return {"ok": True, "task": "low_stock"}


@router.post("/cron/credit-reminders")
async def run_credit_reminders(_: bool = Depends(_verify_cron)):  # noqa: F821
    await check_credit_reminders()
    return {"ok": True, "task": "credit_reminders"}


@router.post("/cron/all")
async def run_all_cron(_: bool = Depends(_verify_cron)):  # noqa: F821
    await send_daily_summary()
    await check_low_stock()
    await check_credit_reminders()
    return {"ok": True, "task": "all"}
