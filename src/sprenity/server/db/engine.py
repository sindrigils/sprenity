import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://sprenity:sprenity@localhost:5432/sprenity",
)

engine = create_async_engine(DATABASE_URL, pool_size=10, max_overflow=0)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession)


async def dispose_engine() -> None:
    await engine.dispose()
