import { useGameStore, type HoverCellFx } from '@core/store/game-store';
import { useInteractionLocked } from '@core/store/interaction-store';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GRID_SIZE, ZONE_COLORS } from './zone-utils';

const HOVER_FADE_MS = 550;
const HOVER_MAX_ALPHA = 0.22;
const HOVER_Y = 0.006;

type WorldCellCenter = {
  x: number;
  z: number;
};

function toWorldCellCenter(cell: { x: number; z: number }): WorldCellCenter {
  return {
    x: cell.x * GRID_SIZE + GRID_SIZE * 0.5,
    z: cell.z * GRID_SIZE + GRID_SIZE * 0.5,
  };
}

function HoverTrailCell({ entry }: { entry: HoverCellFx }) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const center = toWorldCellCenter(entry.cell);

  useFrame(() => {
    if (!materialRef.current) return;

    const age = performance.now() - entry.startedAtMs;
    const fade = Math.max(0, Math.min(1, 1 - age / HOVER_FADE_MS));
    materialRef.current.opacity = HOVER_MAX_ALPHA * fade;
  });

  return (
    <mesh
      position={[center.x, HOVER_Y, center.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={0}
    >
      <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
      <meshBasicMaterial
        ref={materialRef}
        color={entry.color}
        transparent
        opacity={HOVER_MAX_ALPHA}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function ZoneHoverTrail() {
  const interactionMode = useGameStore((state) => state.interactionMode);
  const zoneCounter = useGameStore((state) => state.zoneCounter);
  const hoverTrail = useGameStore((state) => state.hoverTrail);
  const activeHoverCell = useGameStore((state) => state.activeHoverCell);
  const pruneHoverTrail = useGameStore((state) => state.pruneHoverTrail);
  const isLocked = useInteractionLocked();

  const trailEntries = useMemo(() => Array.from(hoverTrail.values()), [hoverTrail]);
  const activeColor = ZONE_COLORS[zoneCounter % ZONE_COLORS.length];
  const activeCenter = useMemo(
    () => (activeHoverCell ? toWorldCellCenter(activeHoverCell.cell) : null),
    [activeHoverCell]
  );

  useFrame(() => {
    pruneHoverTrail(performance.now(), HOVER_FADE_MS);
  });

  if (interactionMode !== 'build' || isLocked) {
    return null;
  }

  return (
    <>
      {activeCenter ? (
        <mesh
          position={[activeCenter.x, HOVER_Y + 0.0005, activeCenter.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={0}
        >
          <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={HOVER_MAX_ALPHA}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}

      {trailEntries.map((entry) => (
        <HoverTrailCell key={`${entry.key}:${entry.startedAtMs}`} entry={entry} />
      ))}
    </>
  );
}
