from app.core.config import Settings


def test_settings_defaults() -> None:
    settings = Settings()

    assert settings.database_url.startswith("postgresql+asyncpg://")
    assert settings.host == "127.0.0.1"
    assert settings.port == 8000
