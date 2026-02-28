from typing import Any, cast

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..types import GridCell, Zone
from .models import ZoneModel


def _to_pydantic(row: ZoneModel) -> Zone:
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
    return _to_pydantic(row)


async def list_zones(db: async_sessionmaker[AsyncSession]) -> list[Zone]:
    async with db() as session:
        result = await session.execute(select(ZoneModel))
        rows = result.scalars().all()
    return [_to_pydantic(row) for row in rows]


async def update_zone(
    db: async_sessionmaker[AsyncSession], zone_id: str, **kwargs: object
) -> Zone | None:
    fields: dict[str, Any] = {}
    for k, v in kwargs.items():
        if v is None:
            continue
        if k == "start_cell" and isinstance(v, dict):
            cell = cast(dict[str, Any], v)
            fields["start_cell_x"] = cell["x"]
            fields["start_cell_z"] = cell["z"]
        elif k == "end_cell" and isinstance(v, dict):
            cell = cast(dict[str, Any], v)
            fields["end_cell_x"] = cell["x"]
            fields["end_cell_z"] = cell["z"]
        else:
            fields[k] = v

    if not fields:
        return await get_zone(db, zone_id)

    async with db() as session:
        await session.execute(
            update(ZoneModel).where(ZoneModel.id == zone_id).values(**fields)
        )
        await session.commit()

    return await get_zone(db, zone_id)


async def delete_zone(db: async_sessionmaker[AsyncSession], zone_id: str) -> bool:
    async with db() as session:
        result = await session.execute(delete(ZoneModel).where(ZoneModel.id == zone_id))
        await session.commit()
    return result.rowcount == 1  # ty: ignore
