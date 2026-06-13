import time
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

RATE_LIMITS = {
    "/api/v1/auth/login": (5, 60),
    "/api/v1/auth/register": (3, 300),
    "/api/v1/shop/store/": (30, 60),
}

DEFAULT_LIMIT = (60, 60)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        limit_key = None
        for pattern, limits in RATE_LIMITS.items():
            if path.startswith(pattern):
                limit_key = pattern
                break

        max_requests, window = RATE_LIMITS.get(limit_key, DEFAULT_LIMIT) if limit_key else DEFAULT_LIMIT
        key = f"{client_ip}:{limit_key or 'default'}"

        now = time.time()
        self.requests[key] = [t for t in self.requests[key] if now - t < window]

        if len(self.requests[key]) >= max_requests:
            return Response(
                content='{"detail":"Too many requests. Please try again later."}',
                status_code=429,
                media_type="application/json",
            )

        self.requests[key].append(now)
        return await call_next(request)
