from typing import List, Optional, Union, Any
import os
import secrets
import re
import urllib.parse
from pydantic_settings import BaseSettings, SettingsConfigDict


import socket

def sanitize_database_url(url: str) -> str:
    """Safely urlencode password and ensure IPv4 pooler compatibility for Supabase."""
    if not url:
        return ""
    url = url.strip()
    pattern = r'^(postgresql(?:\+\w+)?://)([^:]+):(.*)@([^@/]+(?::\d+)?/[^?]+)(.*)$'
    match = re.match(pattern, url)
    if match:
        prefix, user, password, host_db, rest = match.groups()
        encoded_pwd = urllib.parse.quote(urllib.parse.unquote(password))

        # Check for db.<ref>.supabase.co direct domain which lacks IPv4 A-records on newer Supabase infra
        supabase_match = re.search(r'db\.([a-z0-9]+)\.supabase\.co(?::\d+)?', host_db)
        if supabase_match:
            ref = supabase_match.group(1)
            host_only = f"db.{ref}.supabase.co"
            needs_pooler = False
            try:
                socket.getaddrinfo(host_only, 5432)
            except Exception:
                needs_pooler = True

            if needs_pooler:
                pooler_user = f"postgres.{ref}" if not user.startswith(f"postgres.{ref}") else user
                pooler_host_db = f"aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
                return f"{prefix}{pooler_user}:{encoded_pwd}@{pooler_host_db}{rest}"

        return f"{prefix}{user}:{encoded_pwd}@{host_db}{rest}"
    return url


from pydantic import field_validator


class Settings(BaseSettings):
    APP_NAME: str = "NaviOps Port Operations Optimizer"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                import json
                try:
                    return json.loads(v_str)
                except Exception:
                    pass
            return [i.strip() for i in v_str.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip() for i in v]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Direct PostgreSQL / Supabase connection
    DATABASE_URL: str = ""
    DIRECT_URL: str = ""

    # Supabase connection
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # JWT / Auth
    JWT_SECRET: str = ""
    JWT_SECRET_KEY: str = ""
    SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Groq AI — Copilot inference
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def effective_jwt_secret(self) -> str:
        secret = self.JWT_SECRET or self.JWT_SECRET_KEY or self.SECRET_KEY or os.getenv("JWT_SECRET", "")
        if not secret:
            if self.APP_ENV == "production":
                raise RuntimeError(
                    "FATAL: JWT_SECRET environment variable is not set. "
                    "NaviOps cannot start in production without a secure JWT secret. "
                    "Set JWT_SECRET to a strong random value (e.g. openssl rand -hex 32)."
                )
            # Development-only fallback — never reaches production due to check above
            return "naviops-dev-only-secret-do-not-use-in-prod"
        return secret

    @property
    def clean_database_url(self) -> str:
        raw_url = self.DATABASE_URL or self.DIRECT_URL
        if not raw_url:
            for env_candidate in [".env", "../.env", "../../.env"]:
                if os.path.exists(env_candidate):
                    try:
                        with open(env_candidate, "r", encoding="utf-8") as f:
                            for line in f:
                                line = line.strip()
                                if line.startswith("postgresql://"):
                                    raw_url = line
                                    break
                                elif line.startswith("DATABASE_URL="):
                                    raw_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                                    break
                        if raw_url:
                            break
                    except Exception:
                        pass
        return sanitize_database_url(raw_url)


settings = Settings()
