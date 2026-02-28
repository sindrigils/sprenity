from fastapi import APIRouter, HTTPException

from app.core.deps import DBDependency, TmuxDependency
from app.db.repositories import agents as agents_repo
from app.db.repositories import sessions as sessions_repo
from app.db.repositories import zones as zones_repo
from app.schemas.domain import Session, SessionStatus
from app.schemas.requests import AssignAgentRequest, SendKeysRequest

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("")
async def list_sessions(db: DBDependency) -> list[Session]:
    return await sessions_repo.list_sessions(db)


@router.post("", status_code=201)
async def create_session(
    body: AssignAgentRequest,
    db: DBDependency,
    tmux: TmuxDependency,
) -> Session:
    agent = await agents_repo.get_agent(db, body.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    zone = await zones_repo.get_zone(db, body.zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    if not zone.project_path:
        raise HTTPException(status_code=400, detail="Zone must have a project_path")

    existing = await sessions_repo.get_active_session_for_agent(db, body.agent_id)
    if existing:
        raise HTTPException(
            status_code=409, detail="Agent already has an active session"
        )

    session = Session(agent_id=body.agent_id, zone_id=body.zone_id)
    session.tmux_session_name = f"sprenity-{session.id}"

    command = f"claude --model {agent.model}"
    tmux.create_session(session.tmux_session_name, zone.project_path, command)

    return await sessions_repo.add_session(db, session)


@router.get("/{session_id}")
async def get_session(
    session_id: str, db: DBDependency, tmux: TmuxDependency
) -> Session:
    session = await sessions_repo.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == SessionStatus.RUNNING and not tmux.session_exists(
        session.tmux_session_name
    ):
        await sessions_repo.update_session(db, session_id, status=SessionStatus.STOPPED)
        refreshed = await sessions_repo.get_session(db, session_id)
        assert refreshed is not None
        return refreshed

    return session


@router.get("/{session_id}/output")
async def get_session_output(
    session_id: str,
    db: DBDependency,
    tmux: TmuxDependency,
) -> dict[str, str]:
    session = await sessions_repo.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"output": tmux.capture_output(session.tmux_session_name)}


@router.post("/{session_id}/send", status_code=204)
async def send_keys(
    session_id: str,
    body: SendKeysRequest,
    db: DBDependency,
    tmux: TmuxDependency,
) -> None:
    session = await sessions_repo.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != SessionStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Session is not running")

    tmux.send_keys(session.tmux_session_name, body.keys)


@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    db: DBDependency,
    tmux: TmuxDependency,
) -> None:
    session = await sessions_repo.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    tmux.kill_session(session.tmux_session_name)
    await sessions_repo.delete_session(db, session_id)
