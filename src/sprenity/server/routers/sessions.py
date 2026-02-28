from fastapi import APIRouter, HTTPException, Request

from ..db import agents, sessions, zones
from ..types import (
    AssignAgentRequest,
    SendKeysRequest,
    Session,
    SessionStatus,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _get_db(request: Request):
    return request.app.state.db


def _get_tmux(request: Request):
    return request.app.state.tmux


@router.get("")
async def list_sessions(request: Request) -> list[Session]:
    return await sessions.list_sessions(_get_db(request))


@router.post("", status_code=201)
async def create_session(body: AssignAgentRequest, request: Request) -> Session:
    session_factory = _get_db(request)
    tmux = _get_tmux(request)

    agent = await agents.get_agent(session_factory, body.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    zone = await zones.get_zone(session_factory, body.zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    if not zone.project_path:
        raise HTTPException(status_code=400, detail="Zone must have a project_path")

    # One active session per agent
    existing = await sessions.get_active_session_for_agent(
        session_factory, body.agent_id
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Agent already has an active session",
        )

    session = Session(agent_id=body.agent_id, zone_id=body.zone_id)
    session.tmux_session_name = f"sprenity-{session.id}"

    command = f"claude --model {agent.model}"
    tmux.create_session(session.tmux_session_name, zone.project_path, command)

    return await sessions.add_session(session_factory, session)


@router.get("/{session_id}")
async def get_session(session_id: str, request: Request) -> Session:
    session_factory = _get_db(request)
    tmux = _get_tmux(request)

    session = await sessions.get_session(session_factory, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Reconcile status with tmux
    if session.status == SessionStatus.RUNNING and not tmux.session_exists(
        session.tmux_session_name
    ):
        await sessions.update_session(
            session_factory, session_id, status=SessionStatus.STOPPED
        )
        session = await sessions.get_session(session_factory, session_id)
        assert session is not None

    return session


@router.get("/{session_id}/output")
async def get_session_output(session_id: str, request: Request) -> dict[str, str]:
    session_factory = _get_db(request)
    tmux = _get_tmux(request)

    session = await sessions.get_session(session_factory, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    output = tmux.capture_output(session.tmux_session_name)
    return {"output": output}


@router.post("/{session_id}/send", status_code=204)
async def send_keys(session_id: str, body: SendKeysRequest, request: Request) -> None:
    session_factory = _get_db(request)
    tmux = _get_tmux(request)

    session = await sessions.get_session(session_factory, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != SessionStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Session is not running")

    tmux.send_keys(session.tmux_session_name, body.keys)


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: str, request: Request) -> None:
    session_factory = _get_db(request)
    tmux = _get_tmux(request)

    session = await sessions.get_session(session_factory, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    tmux.kill_session(session.tmux_session_name)
    await sessions.delete_session(session_factory, session_id)
