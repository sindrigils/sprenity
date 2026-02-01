import { useGameStore } from '@core/store/game-store';

export function ClickableGround() {
  const selectedAgentId = useGameStore((state) => state.selectedAgentId);
  const moveSelectedAgentTo = useGameStore(
    (state) => state.moveSelectedAgentTo
  );
  const clearSelectedAgentIds = useGameStore(
    (state) => state.clearSelectedAgentIds
  );

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position-y={0}
      onClick={
        selectedAgentId.size > 0
          ? (e) => {
              e.stopPropagation();
              moveSelectedAgentTo(e.point);
              clearSelectedAgentIds();
            }
          : undefined
      }
    >
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
