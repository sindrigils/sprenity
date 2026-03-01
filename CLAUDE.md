# Claude Instructions

## Running the Game

Never run the game yourself. The user will always run it manually and report back what happens.

## Naming Conventions

- **Frontend**: camelCase only (e.g. `characterModel`, `sessionName`)
- **Backend**: snake_case only (e.g. `character_model`, `session_name`)
- `CamelSnakeMiddleware` in `server/app/core/middleware.py` automatically converts incoming camelCase request keys to snake_case and outgoing snake_case response keys to camelCase.

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
