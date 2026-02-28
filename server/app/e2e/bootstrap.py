from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import AgentModel, SessionModel, ZoneModel

SEED_AGENTS = (
    {
        "id": "ranger1",
        "name": "Ranger 1",
        "model": "claude-sonnet",
        "character_model": "Ranger",
    },
    {
        "id": "ranger2",
        "name": "Ranger 2",
        "model": "claude-sonnet",
        "character_model": "Ranger",
    },
)


async def reseed_e2e_data(db: async_sessionmaker[AsyncSession]) -> None:
    async with db() as session:
        await session.execute(delete(SessionModel))
        await session.execute(delete(ZoneModel))
        await session.execute(delete(AgentModel))
        session.add_all(AgentModel(**agent) for agent in SEED_AGENTS)
        await session.commit()
