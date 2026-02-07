import { useGameStore } from '@core/store/game-store';
import { useInteractionLocked } from '@core/store/interaction-store';

export function ClickableGround() {
  const isLocked = useInteractionLocked();
  const selectedAgentId = useGameStore((state) => state.selectedAgentId);
  const moveSelectedAgentTo = useGameStore(
    (state) => state.moveSelectedAgentTo
  );
  const clearSelectedAgentIds = useGameStore(
    (state) => state.clearSelectedAgentIds
  );

  if (isLocked) return null;

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
