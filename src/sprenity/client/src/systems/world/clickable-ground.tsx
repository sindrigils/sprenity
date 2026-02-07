import { useFrame } from '@react-three/fiber';
import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@core/store/game-store';
import {
  useInteractionLocked,
  useInteractionStore,
} from '@core/store/interaction-store';

type GroundClickPulseData = {
  id: number;
  x: number;
  z: number;
  startedAtMs: number;
};

type GroundClickPulseProps = GroundClickPulseData & {
  onDone: (id: number) => void;
};

const PULSE_DURATION_MS = 340;
const PULSE_START_SCALE = 0.8;
const PULSE_END_SCALE = 1.5;
const PULSE_START_OPACITY = 0.95;

function GroundClickPulse({
  id,
  x,
  z,
  startedAtMs,
  onDone,
}: GroundClickPulseProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const finishedRef = useRef(false);

  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return;

    const elapsedMs = performance.now() - startedAtMs;
    const progress = Math.min(Math.max(elapsedMs / PULSE_DURATION_MS, 0), 1);
    const eased = 1 - (1 - progress) * (1 - progress);
    const scale =
      PULSE_START_SCALE + (PULSE_END_SCALE - PULSE_START_SCALE) * eased;

    meshRef.current.scale.setScalar(scale);
    materialRef.current.opacity = PULSE_START_OPACITY * (1 - eased);

    if (progress >= 1 && !finishedRef.current) {
      finishedRef.current = true;
      onDone(id);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]}>
      <ringGeometry args={[0.14, 0.2, 48]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#00ff88"
        transparent
        opacity={PULSE_START_OPACITY}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export function ClickableGround() {
  const isLocked = useInteractionLocked();
  const interactionMode = useGameStore((state) => state.interactionMode);
  const selectedAgentId = useGameStore((state) => state.selectedAgentId);
  const moveSelectedAgentTo = useGameStore(
    (state) => state.moveSelectedAgentTo
  );
  const clearSelectedAgentIds = useGameStore(
    (state) => state.clearSelectedAgentIds
  );
  const consumeGroundClickSuppression = useInteractionStore(
    (state) => state.consumeGroundClickSuppression
  );
  const [pulses, setPulses] = useState<GroundClickPulseData[]>([]);
  const nextPulseIdRef = useRef(0);

  const spawnPulse = useCallback((point: THREE.Vector3) => {
    const id = nextPulseIdRef.current++;
    setPulses((prev) => [
      ...prev,
      {
        id,
        x: point.x,
        z: point.z,
        startedAtMs: performance.now(),
      },
    ]);
  }, []);

  const removePulse = useCallback((id: number) => {
    setPulses((prev) => prev.filter((pulse) => pulse.id !== id));
  }, []);

  if (isLocked || interactionMode !== 'normal') return null;

  return (
    <>
      <mesh
        rotation-x={-Math.PI / 2}
        position-y={0}
        onClick={(e) => {
          if (consumeGroundClickSuppression(performance.now())) {
            e.stopPropagation();
            return;
          }

          e.stopPropagation();
          spawnPulse(e.point);

          if (selectedAgentId.size > 0) {
            moveSelectedAgentTo(e.point);
            clearSelectedAgentIds();
          }
        }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {pulses.map((pulse) => (
        <GroundClickPulse
          key={pulse.id}
          id={pulse.id}
          x={pulse.x}
          z={pulse.z}
          startedAtMs={pulse.startedAtMs}
          onDone={removePulse}
        />
      ))}
    </>
  );
}
