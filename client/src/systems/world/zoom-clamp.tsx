import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, type MutableRefObject } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useInteractionLocked } from '@core/store/interaction-store';

type ZoomClampProps = {
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  baseMinZoom?: number;
  safety?: number;
};

export function ZoomClamp({
  controlsRef,
  baseMinZoom = 8,
  safety = 1.03,
}: ZoomClampProps) {
  const isLocked = useInteractionLocked();
  const size = useThree((state) => state.size);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (isLocked) {
      return;
    }

    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const camera = controls.object;
    if (!('isOrthographicCamera' in camera) || !camera.isOrthographicCamera) {
      return;
    }

    camera.updateMatrixWorld();
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    forward.setFromMatrixColumn(camera.matrixWorld, 2);

    // Camera direction is -forward; keep the view plane above the ground (y=0).
    const directionY = -forward.y;
    const centerY = camera.position.y + directionY * camera.near;
    const safeCenterY = Math.max(centerY, 0.001);
    const required =
      ((Math.abs(right.y) * size.width + Math.abs(up.y) * size.height) /
        (2 * safeCenterY)) *
      safety;

    const minZoom = Math.max(baseMinZoom, required);
    controls.minZoom = minZoom;

    if (camera.zoom < minZoom) {
      controls.object.zoom = minZoom;
      camera.updateProjectionMatrix();
      controls.update();
    }
  });

  return null;
}
