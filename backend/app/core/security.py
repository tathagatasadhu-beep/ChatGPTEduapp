"""
JWT helpers for the two auth flows in this app:

1. Parents authenticate through Supabase Auth. Supabase signs their access
   tokens with its own key (asymmetric ES256/RS256 on current projects,
   published at /auth/v1/.well-known/jwks.json) — we verify those tokens
   against that JWKS rather than holding a shared secret.
2. Students authenticate with a short-lived login code (no email/password).
   We mint our own JWT for that session, signed with APP_JWT_SECRET, and
   verify it the same way we'd verify any first-party token.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import HTTPException

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
APP_JWT_SECRET = os.environ.get("APP_JWT_SECRET", "")
STUDENT_TOKEN_TTL = timedelta(days=7)

_jwks_client = jwt.PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json") if SUPABASE_URL else None


def decode_supabase_jwt(token: str) -> dict[str, Any]:
    """Verify a parent's Supabase-issued access token and return its claims."""
    if _jwks_client is None:
        raise HTTPException(status_code=500, detail="SUPABASE_URL is not configured.")
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            leeway=30,  # tolerate small clock drift between this server and Supabase's
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {exc}") from exc


def create_student_token(student_id: str, parent_user_id: str) -> str:
    """Issue a scoped, first-party JWT after a successful login-code check."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": student_id,
        "parent_user_id": parent_user_id,
        "role": "student",
        "iat": now,
        "exp": now + STUDENT_TOKEN_TTL,
    }
    return jwt.encode(payload, APP_JWT_SECRET, algorithm="HS256")


def decode_student_token(token: str) -> dict[str, Any]:
    try:
        claims = jwt.decode(token, APP_JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid or expired student token: {exc}") from exc
    if claims.get("role") != "student":
        raise HTTPException(status_code=401, detail="Not a student token.")
    return claims
