import os
import stripe
from typing import Optional

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

PLANS = {
    "free": {"name": "Gratuit", "price_cfa": 0, "products_limit": 50, "features": ["POS de base", "50 produits", "1 utilisateur"]},
    "pro": {"name": "Pro", "price_cfa": 15000, "price_stripe": 2500, "products_limit": 500, "features": ["POS illimité", "500 produits", "5 utilisateurs", "Boutique en ligne", "Rapports avancés"]},
    "enterprise": {"name": "Entreprise", "price_cfa": 45000, "price_stripe": 7500, "products_limit": -1, "features": ["Tout Pro", "Produits illimités", "Utilisateurs illimités", "API", "Support prioritaire"]},
}


def get_plan_features(plan: str) -> dict:
    return PLANS.get(plan, PLANS["free"])


async def create_stripe_customer(email: str, name: str) -> Optional[str]:
    if not stripe.api_key:
        return None
    try:
        customer = stripe.Customer.create(email=email, name=name)
        return customer.id
    except Exception:
        return None


async def create_checkout_session(
    customer_id: str,
    plan: str,
    success_url: str,
    cancel_url: str,
) -> Optional[str]:
    if not stripe.api_key or plan not in PLANS:
        return None
    
    plan_info = PLANS[plan]
    if plan_info["price_cfa"] == 0:
        return None

    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "xof",
                    "product_data": {"name": f"Baay Réseau — {plan_info['name']}"},
                    "unit_amount": plan_info["price_stripe"],
                },
                "quantity": 1,
            }],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"plan": plan},
        )
        return session.url
    except Exception:
        return None


async def create_billing_portal(customer_id: str, return_url: str) -> Optional[str]:
    if not stripe.api_key:
        return None
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return session.url
    except Exception:
        return None


async def handle_stripe_webhook(payload: bytes, sig_header: str) -> dict:
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    if not webhook_secret:
        return {"status": "no_secret"}

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return {"status": "invalid"}

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        return {
            "status": "subscription_created",
            "customer_id": session.get("customer"),
            "subscription_id": session.get("subscription"),
            "plan": session.get("metadata", {}).get("plan", "pro"),
        }

    if event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        return {
            "status": "subscription_updated",
            "subscription_id": subscription.get("id"),
            "status": subscription.get("status"),
        }

    if event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        return {
            "status": "subscription_cancelled",
            "subscription_id": subscription.get("id"),
        }

    return {"status": "unhandled"}
