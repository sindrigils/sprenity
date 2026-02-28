import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { WorldZoneRect } from './zone-utils';

type ZoneOutlineProps = {
  rect: WorldZoneRect;
  color: string;
  y: number;
  borderOpacity: number;
  lineWidth?: number;
};

export function ZoneOutline({
  rect,
  color,
  y,
  borderOpacity,
  lineWidth = 4,
}: ZoneOutlineProps) {
  const { size } = useThree();

  const line = useMemo(() => {
    const geometry = new LineGeometry();
    geometry.setPositions([
      rect.xMin,
      y,
      rect.zMin,
      rect.xMax,
      y,
      rect.zMin,
      rect.xMax,
      y,
      rect.zMax,
      rect.xMin,
      y,
      rect.zMax,
      rect.xMin,
      y,
      rect.zMin,
    ]);

    const material = new LineMaterial({
      color,
      linewidth: lineWidth,
      transparent: true,
      opacity: borderOpacity,
      toneMapped: false,
    });
    material.resolution.set(size.width, size.height);
    material.depthWrite = false;

    const outline = new Line2(geometry, material);
    outline.frustumCulled = false;
    outline.renderOrder = 3;

    return outline;
  }, [borderOpacity, color, lineWidth, rect.xMax, rect.xMin, rect.zMax, rect.zMin, size.height, size.width, y]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as LineMaterial).dispose();
    };
  }, [line]);

  return <primitive object={line} />;
}
