import { useZones } from '@api/zones/hooks';
import { useGameStore } from '@core/store/game-store';
import { useMemo, type RefObject } from 'react';
import { ZoneBuilder } from './zone-builder';
import { ZoneHoverTrail } from './zone-hover-trail';
import { ZoneMesh } from './zone-mesh';
import { ZonePreview } from './zone-preview';
import { ZONE_COLORS } from './zone-utils';

type ZonesProps = {
  boundsRef?: RefObject<HTMLElement | null>;
};

export function Zones({ boundsRef }: ZonesProps) {
  const { data: zones = [] } = useZones();
  const zoneDragStart = useGameStore((state) => state.zoneDragStart);
  const zoneDragEnd = useGameStore((state) => state.zoneDragEnd);

  const zoneCount = zones.length;
  const previewColor = ZONE_COLORS[zoneCount % ZONE_COLORS.length];

  const zoneIds = useMemo(() => zones.map((z) => z.id).join(','), [zones]);

  return (
    <>
      <ZoneBuilder
        boundsRef={boundsRef}
        zones={zones}
        zoneCount={zoneCount}
        key={zoneIds}
      />
      <ZoneHoverTrail zoneCount={zoneCount} />

      {zones.map((zone) => (
        <ZoneMesh key={zone.id} zone={zone} />
      ))}

      {zoneDragStart && zoneDragEnd ? (
        <ZonePreview
          startCell={zoneDragStart}
          endCell={zoneDragEnd}
          color={previewColor}
        />
      ) : null}
    </>
  );
}
