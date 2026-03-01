from typing import Annotated, cast

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.requests import HTTPConnection

from app.services.tmux import TmuxService


class AppState:
    db: async_sessionmaker[AsyncSession]
    tmux: TmuxService


def get_db(connection: HTTPConnection) -> async_sessionmaker[AsyncSession]:
    state = cast(AppState, connection.app.state)
    return state.db


def get_tmux(connection: HTTPConnection) -> TmuxService:
    state = cast(AppState, connection.app.state)
    return state.tmux


DBDependency = Annotated[async_sessionmaker[AsyncSession], Depends(get_db)]
TmuxDependency = Annotated[TmuxService, Depends(get_tmux)]
