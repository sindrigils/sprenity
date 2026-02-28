from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import SessionModel
from app.schemas.domain import Session, SessionStatus


def _to_domain(row: SessionModel) -> Session:
    return Session(
        id=row.id,
        agent_id=row.agent_id,
        zone_id=row.zone_id,
        tmux_session_name=row.tmux_session_name,
        status=SessionStatus(row.status),
    )


async def add_session(
    db: async_sessionmaker[AsyncSession], session: Session
) -> Session:
    async with db() as db_session:
        row = SessionModel(
            id=session.id,
            agent_id=session.agent_id,
            zone_id=session.zone_id,
            tmux_session_name=session.tmux_session_name,
            status=str(session.status),
        )
        db_session.add(row)
        await db_session.commit()
    return session


async def get_session(
    db: async_sessionmaker[AsyncSession], session_id: str
) -> Session | None:
    async with db() as db_session:
        row = await db_session.get(SessionModel, session_id)
    if row is None:
        return None
    return _to_domain(row)


async def list_sessions(db: async_sessionmaker[AsyncSession]) -> list[Session]:
    async with db() as db_session:
        result = await db_session.execute(select(SessionModel))
        rows = result.scalars().all()
    return [_to_domain(row) for row in rows]


async def update_session(
    db: async_sessionmaker[AsyncSession], session_id: str, **kwargs: object
) -> Session | None:
    fields = {k: str(v) for k, v in kwargs.items() if v is not None}
    if not fields:
        return await get_session(db, session_id)

    async with db() as db_session:
        await db_session.execute(
            update(SessionModel).where(SessionModel.id == session_id).values(**fields)
        )
        await db_session.commit()

    return await get_session(db, session_id)


async def delete_session(db: async_sessionmaker[AsyncSession], session_id: str) -> bool:
    if await get_session(db, session_id) is None:
        return False

    async with db() as db_session:
        await db_session.execute(
            delete(SessionModel).where(SessionModel.id == session_id)
        )
        await db_session.commit()
    return True


async def get_sessions_for_agent(
    db: async_sessionmaker[AsyncSession], agent_id: str
) -> list[Session]:
    async with db() as db_session:
        result = await db_session.execute(
            select(SessionModel).where(SessionModel.agent_id == agent_id)
        )
        rows = result.scalars().all()
    return [_to_domain(row) for row in rows]


async def get_sessions_for_zone(
    db: async_sessionmaker[AsyncSession], zone_id: str
) -> list[Session]:
    async with db() as db_session:
        result = await db_session.execute(
            select(SessionModel).where(SessionModel.zone_id == zone_id)
        )
        rows = result.scalars().all()
    return [_to_domain(row) for row in rows]


async def get_active_session_for_agent(
    db: async_sessionmaker[AsyncSession], agent_id: str
) -> Session | None:
    async with db() as db_session:
        result = await db_session.execute(
            select(SessionModel).where(
                SessionModel.agent_id == agent_id,
                SessionModel.status == SessionStatus.RUNNING.value,
            )
        )
        row = result.scalars().first()
    if row is None:
        return None
    return _to_domain(row)
