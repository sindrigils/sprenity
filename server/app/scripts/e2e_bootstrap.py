import argparse
import asyncio
import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Base
from app.e2e.bootstrap import reseed_e2e_data

DEFAULT_DATABASE_URL = "sqlite+aiosqlite:///./.e2e/playwright.db"


def _sqlite_path_from_url(database_url: str) -> Path | None:
    prefix = "sqlite+aiosqlite:///"
    if not database_url.startswith(prefix):
        return None

    raw = database_url.removeprefix(prefix)
    if raw == ":memory:":
        return None

    path = Path(raw)
    if path.is_absolute():
        return path

    return (Path.cwd() / path).resolve()


async def bootstrap_e2e_database(database_url: str, reset: bool) -> None:
    sqlite_path = _sqlite_path_from_url(database_url)
    if reset and sqlite_path is not None:
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        if sqlite_path.exists():
            sqlite_path.unlink()

    engine = create_async_engine(database_url)
    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    try:
        async with engine.begin() as conn:
            if reset:
                await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

        await reseed_e2e_data(session_factory)
    finally:
        await engine.dispose()


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Bootstrap isolated e2e database with deterministic seed data.",
    )
    parser.add_argument(
        "--database-url",
        default=os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL),
        help="Database URL for the test database.",
    )
    parser.add_argument(
        "--keep-existing",
        action="store_true",
        help="Keep existing schema/data instead of resetting first.",
    )
    return parser


def main() -> None:
    args = _build_parser().parse_args()
    asyncio.run(
        bootstrap_e2e_database(
            database_url=args.database_url,
            reset=not args.keep_existing,
        )
    )


if __name__ == "__main__":
    main()
