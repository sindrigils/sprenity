from fastapi import APIRouter, HTTPException, Request

from ..db import agents, sessions
from ..types import Agent, CreateAgentRequest, UpdateAgentRequest

router = APIRouter(prefix="/api/agents", tags=["agents"])


def _get_db(request: Request):
    return request.app.state.db


def _get_tmux(request: Request):
    return request.app.state.tmux


@router.get("")
async def list_agents(request: Request) -> list[Agent]:
    return await agents.list_agents(_get_db(request))


@router.post("", status_code=201)
async def create_agent(body: CreateAgentRequest, request: Request) -> Agent:
    agent = Agent(
        name=body.name,
        model=body.model,
        character_model=body.character_model,
    )
    return await agents.add_agent(_get_db(request), agent)


@router.get("/{agent_id}")
async def get_agent(agent_id: str, request: Request) -> Agent:
    agent = await agents.get_agent(_get_db(request), agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}")
async def update_agent(
    agent_id: str, body: UpdateAgentRequest, request: Request
) -> Agent:
    session = _get_db(request)
    if not await agents.get_agent(session, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")
    updates = body.model_dump(exclude_none=True)
    updated = await agents.update_agent(session, agent_id, **updates)
    assert updated is not None
    return updated


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: str, request: Request) -> None:
    session = _get_db(request)
    tmux = _get_tmux(request)

    if not await agents.get_agent(session, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")

    # Cascading delete: kill all sessions for this agent
    for s in await sessions.get_sessions_for_agent(session, agent_id):
        tmux.kill_session(s.tmux_session_name)
        await sessions.delete_session(session, s.id)

    await agents.delete_agent(session, agent_id)
