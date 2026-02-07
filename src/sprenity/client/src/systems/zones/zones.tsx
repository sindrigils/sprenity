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
  const zones = useGameStore((state) => state.zones);
  const zoneDragStart = useGameStore((state) => state.zoneDragStart);
  const zoneDragEnd = useGameStore((state) => state.zoneDragEnd);
  const zoneCounter = useGameStore((state) => state.zoneCounter);

  const zoneList = useMemo(() => Array.from(zones.values()), [zones]);
  const previewColor = ZONE_COLORS[zoneCounter % ZONE_COLORS.length];

  return (
    <>
      <ZoneBuilder boundsRef={boundsRef} />
      <ZoneHoverTrail />

      {zoneList.map((zone) => (
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
