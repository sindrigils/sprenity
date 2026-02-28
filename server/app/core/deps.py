from typing import Annotated, cast

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.services.tmux import TmuxService


class AppState:
    db: async_sessionmaker[AsyncSession]
    tmux: TmuxService


def get_db(request: Request) -> async_sessionmaker[AsyncSession]:
    state = cast(AppState, request.app.state)
    return state.db


def get_tmux(request: Request) -> TmuxService:
    state = cast(AppState, request.app.state)
    return state.tmux


DBDependency = Annotated[async_sessionmaker[AsyncSession], Depends(get_db)]
TmuxDependency = Annotated[TmuxService, Depends(get_tmux)]
