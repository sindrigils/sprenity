import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import type { ApiZone } from '@api/zones/requests';
import { useModal } from '@ui/modals';
import { gridCellsToWorldRect } from './zone-utils';
import { ZoneOutline } from './zone-outline';

type ZoneMeshProps = {
  zone: ApiZone;
};

export function ZoneMesh({ zone }: ZoneMeshProps) {
  const { openModal } = useModal();
  const rect = useMemo(
    () => gridCellsToWorldRect(zone.startCell, zone.endCell),
    [zone.endCell, zone.startCell],
  );

  const labelOffsetOutside = 0.42;
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
