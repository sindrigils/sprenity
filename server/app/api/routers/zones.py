from fastapi import APIRouter, HTTPException

from app.core.deps import DBDependency, TmuxDependency
from app.db.repositories import sessions as sessions_repo
from app.db.repositories import zones as zones_repo
from app.schemas.domain import Zone
from app.schemas.requests import CreateZoneRequest, UpdateZoneRequest

router = APIRouter(prefix="/api/zones", tags=["zones"])


@router.get("")
async def list_zones(db: DBDependency) -> list[Zone]:
    return await zones_repo.list_zones(db)


@router.post("", status_code=201)
async def create_zone(body: CreateZoneRequest, db: DBDependency) -> Zone:
    zone = Zone(
        name=body.name,
        start_cell=body.start_cell,
        end_cell=body.end_cell,
        color=body.color,
        project_path=body.project_path,
    )
    return await zones_repo.add_zone(db, zone)


@router.get("/{zone_id}")
async def get_zone(zone_id: str, db: DBDependency) -> Zone:
    zone = await zones_repo.get_zone(db, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.patch("/{zone_id}")
async def update_zone(zone_id: str, body: UpdateZoneRequest, db: DBDependency) -> Zone:
    if not await zones_repo.get_zone(db, zone_id):
        raise HTTPException(status_code=404, detail="Zone not found")

    updated = await zones_repo.update_zone(
        db, zone_id, **body.model_dump(exclude_none=True)
    )
    assert updated is not None
    return updated


@router.delete("/{zone_id}", status_code=204)
async def delete_zone(zone_id: str, db: DBDependency, tmux: TmuxDependency) -> None:
    if not await zones_repo.get_zone(db, zone_id):
        raise HTTPException(status_code=404, detail="Zone not found")

    for session in await sessions_repo.get_sessions_for_zone(db, zone_id):
        await tmux.kill_session(session.tmux_session_name)
        await sessions_repo.delete_session(db, session.id)

    await zones_repo.delete_zone(db, zone_id)
