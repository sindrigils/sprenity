import * as THREE from 'three';
import type { GridCell, Zone } from '@core/store/game-store';

export const GRID_SIZE = 1;

export const ZONE_COLORS = [
  '#00ff88',
  '#ff00ff',
  '#00ffff',
  '#ffff00',
  '#ff6600',
] as const;

export interface WorldZoneRect {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  width: number;
  depth: number;
  centerX: number;
  centerZ: number;
}

export function worldToGridCell(worldPos: THREE.Vector3): GridCell {
  return {
    x: Math.floor(worldPos.x / GRID_SIZE),
    z: Math.floor(worldPos.z / GRID_SIZE),
  };
}

export function normalizeCells(
  a: GridCell,
  b: GridCell
): { startCell: GridCell; endCell: GridCell } {
  return {
    startCell: {
      x: Math.min(a.x, b.x),
      z: Math.min(a.z, b.z),
    },
    endCell: {
      x: Math.max(a.x, b.x),
      z: Math.max(a.z, b.z),
    },
  };
}

export function gridCellsToWorldRect(
  startCell: GridCell,
  endCell: GridCell
): WorldZoneRect {
  const { startCell: minCell, endCell: maxCell } = normalizeCells(
    startCell,
    endCell
  );

  const xMin = minCell.x * GRID_SIZE;
  const xMax = (maxCell.x + 1) * GRID_SIZE;
  const zMin = minCell.z * GRID_SIZE;
  const zMax = (maxCell.z + 1) * GRID_SIZE;

  const width = xMax - xMin;
  const depth = zMax - zMin;

  return {
    xMin,
    xMax,
    zMin,
    zMax,
    width,
    depth,
    centerX: (xMin + xMax) * 0.5,
    centerZ: (zMin + zMax) * 0.5,
  };
}

export function zonesTouchOrOverlap(
  aStartCell: GridCell,
  aEndCell: GridCell,
  bStartCell: GridCell,
  bEndCell: GridCell
): boolean {
  const a = gridCellsToWorldRect(aStartCell, aEndCell);
  const b = gridCellsToWorldRect(bStartCell, bEndCell);

  const separated =
    a.xMax < b.xMin || b.xMax < a.xMin || a.zMax < b.zMin || b.zMax < a.zMin;

  return !separated;
}

export function touchesOrOverlapsAnyZone(
  startCell: GridCell,
  endCell: GridCell,
  zones: Iterable<Zone>
): boolean {
  for (const zone of zones) {
    if (zonesTouchOrOverlap(startCell, endCell, zone.startCell, zone.endCell)) {
      return true;
    }
  }

  return false;
}
