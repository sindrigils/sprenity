from fastapi import APIRouter, HTTPException, Request

from ..db import sessions, zones
from ..types import CreateZoneRequest, UpdateZoneRequest, Zone

router = APIRouter(prefix="/api/zones", tags=["zones"])


def _get_db(request: Request):
    return request.app.state.db


def _get_tmux(request: Request):
    return request.app.state.tmux


@router.get("")
async def list_zones(request: Request) -> list[Zone]:
    return await zones.list_zones(_get_db(request))


@router.post("", status_code=201)
async def create_zone(body: CreateZoneRequest, request: Request) -> Zone:
    zone = Zone(
        name=body.name,
        start_cell=body.start_cell,
        end_cell=body.end_cell,
        color=body.color,
        project_path=body.project_path,
    )
    return await zones.add_zone(_get_db(request), zone)


@router.get("/{zone_id}")
async def get_zone(zone_id: str, request: Request) -> Zone:
    zone = await zones.get_zone(_get_db(request), zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.patch("/{zone_id}")
async def update_zone(zone_id: str, body: UpdateZoneRequest, request: Request) -> Zone:
    session = _get_db(request)
    if not await zones.get_zone(session, zone_id):
        raise HTTPException(status_code=404, detail="Zone not found")
    updated = await zones.update_zone(
        session, zone_id, **body.model_dump(exclude_none=True)
    )
    assert updated is not None
    return updated


@router.delete("/{zone_id}", status_code=204)
async def delete_zone(zone_id: str, request: Request) -> None:
    session = _get_db(request)
    tmux = _get_tmux(request)

    if not await zones.get_zone(session, zone_id):
        raise HTTPException(status_code=404, detail="Zone not found")

    # Cascading delete: kill all sessions for this zone
    for s in await sessions.get_sessions_for_zone(session, zone_id):
        tmux.kill_session(s.tmux_session_name)
        await sessions.delete_session(session, s.id)

    await zones.delete_zone(session, zone_id)
