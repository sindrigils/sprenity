from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import agents, e2e, sessions, zones
from app.core.config import Settings, get_settings
from app.core.middleware import CamelSnakeMiddleware
from app.db import Database
from app.services.tmux import TmuxService


def create_app(settings: Settings | None = None) -> FastAPI:
    cfg = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        database = Database(cfg.database_url)

        app.state.db = database.session_factory
        app.state.tmux = TmuxService(cfg.tmux_bin)

        yield

        await database.dispose()

    app = FastAPI(title=cfg.app_name, lifespan=lifespan)

    app.add_middleware(CamelSnakeMiddleware)  # ty: ignore
    app.add_middleware(
        CORSMiddleware,  # ty: ignore
        allow_origins=cfg.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(agents.router)
    app.include_router(zones.router)
    app.include_router(sessions.router)
    if cfg.environment == "test":
        app.include_router(e2e.router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app
