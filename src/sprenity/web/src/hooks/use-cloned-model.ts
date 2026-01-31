import { useMemo } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export function useClonedModel(
  scene: THREE.Object3D,
  id: string,
  position: [number, number, number]
) {
  return useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.position.set(...position);
    clone.userData.selectable = true;
    clone.userData.id = id;

    // Clone materials
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material = child.material.clone();
      }
    });

    return clone;
  }, [scene, id, position]);
}
