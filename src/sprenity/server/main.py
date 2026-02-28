from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import async_session_factory, dispose_engine
from .routers import agents, sessions, zones
from .services.tmux import TmuxService


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.db = async_session_factory
    app.state.tmux = TmuxService()
    yield
    await dispose_engine()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,  # ty: ignore
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)
app.include_router(zones.router)
app.include_router(sessions.router)


@app.get("/health")
def health():
    return {"status": "ok"}


def run():
    uvicorn.run("sprenity.server.main:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    run()
