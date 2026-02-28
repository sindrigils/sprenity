from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sprenity server"
    environment: Literal["development", "test", "production"] = "development"

    database_url: str = Field(
        default="postgresql+asyncpg://sprenity:sprenity@localhost:5432/sprenity",
        validation_alias=AliasChoices("DATABASE_URL", "SPRENITY_DATABASE_URL"),
    )
    tmux_bin: str = Field(
        default="/opt/homebrew/bin/tmux",
        validation_alias=AliasChoices("TMUX_BIN", "SPRENITY_TMUX_BIN"),
    )

    host: str = Field(
        default="127.0.0.1", validation_alias=AliasChoices("HOST", "SPRENITY_HOST")
    )
    port: int = Field(
        default=8000, validation_alias=AliasChoices("PORT", "SPRENITY_PORT")
    )

    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="SPRENITY_",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
