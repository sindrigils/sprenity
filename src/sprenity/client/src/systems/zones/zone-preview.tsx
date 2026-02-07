import { useMemo } from 'react';
import type { GridCell } from '@core/store/game-store';
import { gridCellsToWorldRect } from './zone-utils';
import { ZoneOutline } from './zone-outline';

type ZonePreviewProps = {
  startCell: GridCell;
  endCell: GridCell;
  color: string;
};

export function ZonePreview({ startCell, endCell, color }: ZonePreviewProps) {
  const rect = useMemo(
    () => gridCellsToWorldRect(startCell, endCell),
    [endCell, startCell]
  );

  return (
    <group>
      <mesh
        position={[rect.centerX, 0.02, rect.centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <planeGeometry args={[rect.width, rect.depth]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <ZoneOutline
        rect={rect}
        color={color}
        y={0.0225}
        borderOpacity={0.7}
        lineWidth={4}
      />
    </group>
  );
}
