# Claude Instructions

## Running the Game

Never run the game yourself. The user will always run it manually and report back what happens.

## Backend (server/)

- Uses **uv** as the package manager.
- Canonical local run command: `uv run python -m uvicorn app.main:app --reload`
- **Linting & Formatting**: Ruff
  - Lint: `uv run ruff check .`
  - Format: `uv run ruff format .`
- **Type Checking**: ty
  - `uv run ty check .`
- **Database Migrations**: Alembic
  - Generate migration: `uv run alembic revision --autogenerate -m "description"`
  - Apply migrations: `uv run alembic upgrade head`
