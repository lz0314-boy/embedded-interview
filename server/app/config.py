from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


SERVER_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=SERVER_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    openai_api_key: SecretStr | None = Field(default=None, validation_alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-5-mini", validation_alias="OPENAI_MODEL")
    openai_base_url: str | None = Field(default=None, validation_alias="OPENAI_BASE_URL")
    openai_api_mode: str = Field(default="responses", validation_alias="OPENAI_API_MODE")
    assistant_access_token: SecretStr | None = Field(
        default=None, validation_alias="ASSISTANT_ACCESS_TOKEN"
    )
    local_only: bool = Field(default=False, validation_alias="LOCAL_ONLY")
    cors_origins: str = Field(
        default="https://lz0314-boy.github.io,http://localhost:8000,http://127.0.0.1:8000",
        validation_alias="CORS_ORIGINS",
    )
    public_knowledge_path: Path = Field(
        default=SERVER_DIR / "knowledge" / "public" / "interview.json",
        validation_alias="PUBLIC_KNOWLEDGE_PATH",
    )
    private_knowledge_path: Path = Field(
        default=SERVER_DIR / "private_knowledge",
        validation_alias="PRIVATE_KNOWLEDGE_PATH",
    )
    retrieval_limit: int = Field(default=6, ge=1, le=12, validation_alias="RETRIEVAL_LIMIT")
    openai_timeout_seconds: float = Field(
        default=90.0, ge=10.0, le=300.0, validation_alias="OPENAI_TIMEOUT_SECONDS"
    )

    def allowed_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
