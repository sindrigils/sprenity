from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import AgentModel
from app.schemas.domain import Agent, CharacterModel, ClaudeModel


def _to_domain(row: AgentModel) -> Agent:
    return Agent(
        id=row.id,
        name=row.name,
        model=ClaudeModel(row.model),
        character_model=CharacterModel(row.character_model),
    )


async def add_agent(db: async_sessionmaker[AsyncSession], agent: Agent) -> Agent:
    async with db() as session:
        row = AgentModel(
            id=agent.id,
            name=agent.name,
            model=str(agent.model),
            character_model=str(agent.character_model),
        )
        session.add(row)
        await session.commit()
    return agent


async def get_agent(
    db: async_sessionmaker[AsyncSession], agent_id: str
) -> Agent | None:
    async with db() as session:
        row = await session.get(AgentModel, agent_id)
    if row is None:
        return None
    return _to_domain(row)


async def list_agents(db: async_sessionmaker[AsyncSession]) -> list[Agent]:
    async with db() as session:
        result = await session.execute(select(AgentModel))
        rows = result.scalars().all()
    return [_to_domain(row) for row in rows]


async def update_agent(
    db: async_sessionmaker[AsyncSession], agent_id: str, **kwargs: object
) -> Agent | None:
    fields = {k: str(v) for k, v in kwargs.items() if v is not None}
    if not fields:
        return await get_agent(db, agent_id)

    async with db() as session:
        await session.execute(
            update(AgentModel).where(AgentModel.id == agent_id).values(**fields)
        )
        await session.commit()

    return await get_agent(db, agent_id)


async def delete_agent(db: async_sessionmaker[AsyncSession], agent_id: str) -> bool:
    if await get_agent(db, agent_id) is None:
        return False

    async with db() as session:
        await session.execute(delete(AgentModel).where(AgentModel.id == agent_id))
        await session.commit()
    return True
