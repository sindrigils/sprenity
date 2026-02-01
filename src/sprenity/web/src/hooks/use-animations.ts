import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import type * as THREE from 'three';

const MOVEMENT_ANIMATIONS_PATH =
  '/assets/animations/Rig_Medium_MovementBasic.glb';
const GENERAL_ANIMATIONS_PATH = '/assets/animations/Rig_Medium_General.glb';

export function useAnimations() {
  const { animations: movementAnims } = useGLTF(MOVEMENT_ANIMATIONS_PATH);
  const { animations: generalAnims } = useGLTF(GENERAL_ANIMATIONS_PATH);

  const allAnimations = useMemo(
    () => [...movementAnims, ...generalAnims],
    [movementAnims, generalAnims]
  );

  const getClip = (name: string): THREE.AnimationClip | undefined => {
    return allAnimations.find((clip) => clip.name === name);
  };

  return { animations: allAnimations, getClip };
}

// Preload animations
useGLTF.preload(MOVEMENT_ANIMATIONS_PATH);
useGLTF.preload(GENERAL_ANIMATIONS_PATH);
