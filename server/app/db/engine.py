from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


class Database:
    def __init__(self, database_url: str) -> None:
        self.engine: AsyncEngine = create_async_engine(
            database_url,
            pool_size=10,
            max_overflow=0,
        )
        self.session_factory = async_sessionmaker(self.engine, class_=AsyncSession)

    async def dispose(self) -> None:
        await self.engine.dispose()
