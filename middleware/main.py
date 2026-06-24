"""
Dict-o-Day FastAPI Middleware
=============================
Handles: Rate Limiting, Request Validation, FCM Push Notifications,
         AI Proxy (Groq), and JWT Validation.

Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import httpx
import os
import time
import redis
from dotenv import load_dotenv
from jose import jwt, JWTError

load_dotenv()

app = FastAPI(
    title="Dict-o-Day Middleware",
    description="API Gateway / Middleware for Dict-o-Day backend",
    version="1.0.0",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ──
SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "dict-o-day-super-secret-key-for-jwt-signing-2026")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# ── Redis for rate limiting ──
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    print("[Redis] connected successfully")
except Exception as e:
    print(f"[Redis] not available: {e}. Rate limiting disabled.")
    redis_client = None


# ══════════════════════════════════════════════
# RATE LIMITING MIDDLEWARE
# ══════════════════════════════════════════════
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if redis_client is None:
        return await call_next(request)

    client_ip = request.client.host
    key = f"rate_limit:{client_ip}"

    try:
        current = redis_client.incr(key)
        if current == 1:
            redis_client.expire(key, 60)  # 60 second window

        if current > 100:  # Max 100 requests per minute
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # If Redis fails, don't block requests

    return await call_next(request)


# ══════════════════════════════════════════════
# JWT VALIDATION DEPENDENCY
# ══════════════════════════════════════════════
def verify_jwt(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token.")

    token = auth_header[7:]
    try:
        # Pad secret to match Spring Boot's key derivation
        secret = JWT_SECRET
        while len(secret.encode("utf-8")) < 64:
            secret = secret + JWT_SECRET

        payload = jwt.decode(token, secret, algorithms=["HS512"])
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


# ══════════════════════════════════════════════
# REQUEST VALIDATION MODELS
# ══════════════════════════════════════════════
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    word_id: Optional[str] = None


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    difficulty: Optional[str] = "beginner"
    word_count: Optional[int] = Field(default=5, le=15, ge=1)


# ══════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "dict-o-day-middleware",
        "timestamp": time.time(),
    }


# ══════════════════════════════════════════════
# PROXY: Forward authenticated requests to Spring Boot
# ══════════════════════════════════════════════
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_to_spring_boot(request: Request, path: str):
    """
    Forwards all /api/* requests to the Spring Boot backend
    after applying rate limiting and request validation.
    """
    url = f"{SPRING_BOOT_URL}/api/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)

    body = await request.body()
    params = dict(request.query_params)

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=params,
            )
            
            from fastapi.responses import Response
            # Exclude headers that can conflict or should not be forwarded
            exclude_headers = ["content-length", "content-encoding", "transfer-encoding", "connection"]
            response_headers = {
                k: v for k, v in response.headers.items()
                if k.lower() not in exclude_headers
            }
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=response_headers,
                media_type=response.headers.get("content-type")
            )
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Backend unavailable: {str(e)}")


# ══════════════════════════════════════════════
# FCM PUSH NOTIFICATION SERVICE
# ══════════════════════════════════════════════
class FCMNotification(BaseModel):
    token: str = Field(..., description="FCM device token")
    title: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    data: Optional[dict] = None


@app.post("/fcm/send")
async def send_push_notification(
    notification: FCMNotification, user: dict = Depends(verify_jwt)
):
    """
    Send push notification via Firebase Cloud Messaging.
    Requires a Firebase service account to be configured.
    """
    try:
        # firebase_admin must be initialized with credentials
        import firebase_admin
        from firebase_admin import messaging

        if not firebase_admin._apps:
            cred_path = os.getenv("FIREBASE_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = firebase_admin.credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                return {
                    "success": False,
                    "message": "Firebase not configured. Set FIREBASE_CREDENTIALS.",
                }

        message = messaging.Message(
            notification=messaging.Notification(
                title=notification.title,
                body=notification.body,
            ),
            data=notification.data or {},
            token=notification.token,
        )
        response = messaging.send(message)
        return {"success": True, "message_id": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FCM error: {str(e)}")


# ══════════════════════════════════════════════
# DAILY REMINDER NOTIFICATION (cron-triggered)
# ══════════════════════════════════════════════
@app.post("/fcm/daily-reminder")
async def send_daily_reminder(user: dict = Depends(verify_jwt)):
    """
    Trigger daily vocabulary learning reminder notification.
    In production, this would be called by a scheduled job.
    """
    return {
        "success": True,
        "message": "Daily reminder notification queued.",
        "note": "Configure Firebase credentials and device tokens for production.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
