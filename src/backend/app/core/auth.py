import logging
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import jwt
from fastapi import Header, HTTPException, status, Depends
from app.core.config import settings
from app.models.schemas import SignupRequest, LoginRequest, AuthResponse, UserResponse

logger = logging.getLogger("naviops.auth")

import secrets


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a unique 16-byte salt (NIST compliant)."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash with constant-time comparison."""
    if not hashed_password or not plain_password:
        return False
    if "$" not in hashed_password:
        # Legacy/demo accounts check (plain match or legacy sha256)
        if secrets.compare_digest(plain_password, hashed_password):
            return True
        old_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        return secrets.compare_digest(old_hash, hashed_password)
    try:
        salt, key_hex = hashed_password.split("$", 1)
        test_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return secrets.compare_digest(test_key.hex(), key_hex)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate signed JWT access token for user session."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, settings.effective_jwt_secret, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.effective_jwt_secret, algorithms=[settings.JWT_ALGORITHM])

        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.debug(f"JWT decode error: {e}")
        return None


def get_current_user(authorization: Optional[str] = Header(None)) -> UserResponse:
    """
    Extracts and validates JWT bearer token from Authorization header.
    Strictly returns HTTP 401 Unauthorized if missing, malformed, or invalid.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Must be 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1].strip()

    # 1. Decode and validate JWT
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is invalid or has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    email = payload.get("email")

    # Match user in persistent repository
    from app.core.database import port_repo
    user = None
    if user_id and user_id in port_repo.users:
        user = port_repo.users[user_id]
    elif email:
        for u in port_repo.users.values():
            if u.get("email", "").lower() == email.lower():
                user = u
                break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserResponse(**user)


def require_role(allowed_roles: List[str]):
    """
    Enforce Role-Based Access Control:
    - admin: Port Manager / Admin (full permissions + user role management)
    - operations: Operations Staff (create/edit vessels/disruptions + optimize)
    - viewer: Viewer / Executive (read-only access to overview, schedules, and metrics)
    """
    def role_checker(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{current_user.role}' is not authorized. Required: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

