import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import type { Zone } from '@core/store/game-store';
import { useModal } from '@ui/modals';
import { gridCellsToWorldRect } from './zone-utils';
import { ZoneOutline } from './zone-outline';

type ZoneMeshProps = {
  zone: Zone;
};

export function ZoneMesh({ zone }: ZoneMeshProps) {
  const { openModal } = useModal();
  const rect = useMemo(
    () => gridCellsToWorldRect(zone.startCell, zone.endCell),
    [zone.endCell, zone.startCell]
  );

  const labelOffsetOutside = 0.42;
  // Html transform mode still visually centers around the anchor in this setup,
  // so we offset in +X so the first glyph starts at the zone corner.
  const labelX = rect.xMin + 1.4;
  const labelZ = rect.zMax + labelOffsetOutside;

  return (
    <group>
      <mesh
        position={[rect.centerX, 0.01, rect.centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[rect.width, rect.depth]} />
        <meshBasicMaterial
          color={zone.color}
          transparent
          opacity={0.12}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <ZoneOutline
        rect={rect}
        color={zone.color}
        y={0.0125}
        borderOpacity={1}
        lineWidth={4}
      />

      <group position={[labelX, 0.015, labelZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <Html transform center={false} zIndexRange={[35, 0]}>
          <button
            type="button"
            data-zone-label
            className="cursor-pointer border-none bg-transparent p-0 text-left text-[28px] font-bold leading-none"
            style={{ color: zone.color }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              openModal('edit-zone-project', {
                zoneId: zone.id,
                name: zone.name,
                color: zone.color,
                size: 'large',
              });
            }}
          >
            {zone.name}
          </button>
        </Html>
      </group>
    </group>
  );
}
