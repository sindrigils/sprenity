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
