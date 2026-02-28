from typing import Any, cast

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import ZoneModel
from app.schemas.domain import GridCell, Zone


def _to_domain(row: ZoneModel) -> Zone:
    return Zone(
        id=row.id,
        name=row.name,
        start_cell=GridCell(x=row.start_cell_x, z=row.start_cell_z),
        end_cell=GridCell(x=row.end_cell_x, z=row.end_cell_z),
        color=row.color,
        project_path=row.project_path,
    )


async def add_zone(db: async_sessionmaker[AsyncSession], zone: Zone) -> Zone:
    async with db() as session:
        row = ZoneModel(
            id=zone.id,
            name=zone.name,
            start_cell_x=zone.start_cell.x,
            start_cell_z=zone.start_cell.z,
            end_cell_x=zone.end_cell.x,
            end_cell_z=zone.end_cell.z,
            color=zone.color,
            project_path=zone.project_path,
        )
        session.add(row)
        await session.commit()
    return zone


async def get_zone(db: async_sessionmaker[AsyncSession], zone_id: str) -> Zone | None:
    async with db() as session:
        row = await session.get(ZoneModel, zone_id)
    if row is None:
        return None
    return _to_domain(row)


async def list_zones(db: async_sessionmaker[AsyncSession]) -> list[Zone]:
    async with db() as session:
        result = await session.execute(select(ZoneModel))
        rows = result.scalars().all()
    return [_to_domain(row) for row in rows]


async def update_zone(
    db: async_sessionmaker[AsyncSession], zone_id: str, **kwargs: object
) -> Zone | None:
    fields: dict[str, Any] = {}
    for key, value in kwargs.items():
        if value is None:
            continue

        if key == "start_cell":
            if isinstance(value, dict):
                cell = cast(dict[str, int], value)
                fields["start_cell_x"] = cell["x"]
                fields["start_cell_z"] = cell["z"]
            elif isinstance(value, GridCell):
                fields["start_cell_x"] = value.x
                fields["start_cell_z"] = value.z
            continue

        if key == "end_cell":
            if isinstance(value, dict):
                cell = cast(dict[str, int], value)
                fields["end_cell_x"] = cell["x"]
                fields["end_cell_z"] = cell["z"]
            elif isinstance(value, GridCell):
                fields["end_cell_x"] = value.x
                fields["end_cell_z"] = value.z
            continue

        fields[key] = value

    if not fields:
        return await get_zone(db, zone_id)

    async with db() as session:
        await session.execute(
            update(ZoneModel).where(ZoneModel.id == zone_id).values(**fields)
        )
        await session.commit()

    return await get_zone(db, zone_id)


async def delete_zone(db: async_sessionmaker[AsyncSession], zone_id: str) -> bool:
    if await get_zone(db, zone_id) is None:
        return False

    async with db() as session:
        await session.execute(delete(ZoneModel).where(ZoneModel.id == zone_id))
        await session.commit()
    return True
