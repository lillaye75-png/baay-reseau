import json
import time
import httpx
from pathlib import Path
from jose import jwt

SERVICE_ACCOUNT_PATH = Path(__file__).parent.parent.parent / "firebase-service-account.json"

_token_cache = {"token": None, "expires_at": 0}


def _load_service_account() -> dict:
    with open(SERVICE_ACCOUNT_PATH) as f:
        return json.load(f)


def _get_access_token() -> str:
    now = time.time()
    if _token_cache["token"] and _token_cache["expires_at"] > now + 60:
        return _token_cache["token"]

    sa = _load_service_account()
    payload = {
        "iss": sa["client_email"],
        "scope": "https://www.googleapis.com/auth/firebase.messaging",
        "aud": sa["token_uri"],
        "iat": int(now),
        "exp": int(now) + 3600,
    }
    signed_jwt = jwt.encode(payload, sa["private_key"], algorithm="RS256")

    resp = httpx.post(
        sa["token_uri"],
        data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": signed_jwt,
        },
        timeout=10,
    )
    resp.raise_for_status()
    token = resp.json()["access_token"]

    _token_cache["token"] = token
    _token_cache["expires_at"] = now + resp.json().get("expires_in", 3600)
    return token


async def send_push_v1(token: str, title: str, body: str, data: dict | None = None) -> bool:
    access_token = _get_access_token()
    project_id = _load_service_account()["project_id"]

    payload = {
        "message": {
            "token": token,
            "notification": {"title": title, "body": body},
            "webpush": {
                "fcm_options": {"link": "/"},
            },
        }
    }
    if data:
        payload["message"]["data"] = {k: str(v) for k, v in data.items()}

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
        return resp.status_code == 200
