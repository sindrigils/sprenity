# Sprenity Server

FastAPI backend for Sprenity.

## Structure

```text
server/
├── alembic/
├── app/
└── tests/
```

## Setup

```bash
cd server
uv sync
```

## Run

```bash
uv run python -m uvicorn app.main:app --reload
```

## E2E Bootstrap

Seed an isolated test database with deterministic dummy data:

```bash
DATABASE_URL=sqlite+aiosqlite:///./.e2e/playwright.db uv run sprenity-e2e-bootstrap
```

## Migrations

```bash
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

## Quality Checks

```bash
uv run ruff check .
uv run ruff format .
uv run ty check .
uv run pytest
```
