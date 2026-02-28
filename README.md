# Sprenity

A visual management interface for orchestrating multiple Claude Code instances. Create AI agents, assign them to project zones on your machine, and manage their coding work through an interactive 3D environment.

## How It Works

- **Agents** — Each agent is a Claude Code CLI instance represented as a 3D character. You configure their name, model (Sonnet/Opus/Haiku), and appearance.
- **Zones** — Rectangular areas on the grid that map to real project directories on your machine. Drag to create them, then link them to a local path.
- **Orchestration** — Assign agents to zones and manage their coding sessions visually. The backend uses tmux to manage the underlying terminal sessions.

## Architecture

```
.
├── client/    # Electron + React + Three.js frontend (TypeScript)
└── server/    # FastAPI backend (Python package)
```

**Frontend**: React 19, Three.js via react-three-fiber, Zustand for state, Tailwind CSS, Electron for desktop, Playwright for E2E tests.

**Backend**: FastAPI + SQLAlchemy + Alembic, managed with uv. Handles agent lifecycle, zone persistence, and tmux session management.

## Getting Started

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
uv sync
uv run python -m uvicorn app.main:app --reload
```

## Development

### Frontend

```bash
npm run verify:local        # typecheck + lint + smoke tests
npm run test:ui             # full E2E tests
npm run test:ui:smoke       # quick smoke tests
```

### Backend

```bash
uv run ruff check .         # lint
uv run ruff format .        # format
uv run ty check .           # type check
uv run pytest               # tests
```
