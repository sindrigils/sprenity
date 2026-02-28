from fastapi import APIRouter, HTTPException

from app.core.deps import DBDependency, TmuxDependency
from app.db.repositories import agents as agents_repo
from app.db.repositories import sessions as sessions_repo
from app.schemas.domain import Agent
from app.schemas.requests import CreateAgentRequest, UpdateAgentRequest

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("")
async def list_agents(db: DBDependency) -> list[Agent]:
    return await agents_repo.list_agents(db)


@router.post("", status_code=201)
async def create_agent(body: CreateAgentRequest, db: DBDependency) -> Agent:
    agent = Agent(
        name=body.name,
        model=body.model,
        character_model=body.character_model,
    )
    return await agents_repo.add_agent(db, agent)


@router.get("/{agent_id}")
async def get_agent(agent_id: str, db: DBDependency) -> Agent:
    agent = await agents_repo.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}")
async def update_agent(
    agent_id: str,
    body: UpdateAgentRequest,
    db: DBDependency,
) -> Agent:
    if not await agents_repo.get_agent(db, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")

    updated = await agents_repo.update_agent(
        db,
        agent_id,
        **body.model_dump(exclude_none=True),
    )
    assert updated is not None
    return updated


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: str, db: DBDependency, tmux: TmuxDependency) -> None:
    if not await agents_repo.get_agent(db, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")

    for session in await sessions_repo.get_sessions_for_agent(db, agent_id):
        tmux.kill_session(session.tmux_session_name)
        await sessions_repo.delete_session(db, session.id)

    await agents_repo.delete_agent(db, agent_id)
