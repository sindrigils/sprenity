import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useClonedModel } from './hooks/use-cloned-model';
import { useGameStore } from './store/game-store';

interface RangerProps {
  id: string;
  position?: [number, number, number];
}

const applyEmissiveGlow = (object: THREE.Object3D, isEnabled: boolean) => {
  if (isEnabled) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color(0x00ff88); // green-cyan
        mat.emissiveIntensity = 0.6;
      }
    });
  } else {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }
};

export function Ranger({ id, position = [0, 0, 0] }: RangerProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const isSelected = useGameStore((state) => state.selectedAgentId.has(id));

  const registerAgent = useGameStore((state) => state.registerAgent);
  const unregisterAgent = useGameStore((state) => state.unregisterAgent);

  // Load the Ranger model
  const { scene } = useGLTF('/assets/characters/Ranger.glb');
  const clonedScene = useClonedModel(scene, id, position);

  // Load animations
  const { animations: movementAnims } = useGLTF(
    '/assets/animations/Rig_Medium_MovementBasic.glb'
  );
  const { animations: generalAnims } = useGLTF(
    '/assets/animations/Rig_Medium_General.glb'
  );

  const allAnimations = useMemo(
    () => [...movementAnims, ...generalAnims],
    [movementAnims, generalAnims]
  );

  const targetPosition = useGameStore(
    (state) => state.agentsMap.get(id)?.targetPosition
  );

  useEffect(() => {
    let armature: THREE.Object3D | null = null;
    clonedScene.traverse((obj) => {
      if (obj.name === 'Rig_Medium' && obj.type === 'Object3D') {
        armature = obj;
      }
    });

    if (!armature) {
      console.error('No armature found!');
      return;
    }
    const mixer = new THREE.AnimationMixer(armature);
    mixerRef.current = mixer;

    const idleClip = allAnimations.find((clip) => clip.name === 'Idle_A');
    const runningClip = allAnimations.find((clip) => clip.name === 'Running_A');
    if (targetPosition && runningClip) {
      const action = mixer.clipAction(runningClip);
      action.play();
    } else if (idleClip) {
      const action = mixer.clipAction(idleClip);
      action.play();
    }
  }, [clonedScene, allAnimations, targetPosition]);

  useEffect(() => {
    registerAgent(id, clonedScene);
    return () => unregisterAgent(id);
  }, [id, clonedScene, registerAgent, unregisterAgent]);

  useEffect(() => {
    applyEmissiveGlow(clonedScene, isSelected);
  }, [clonedScene, isSelected]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
    if (targetPosition) {
      const currentPosition = clonedScene.position;
      const direction = targetPosition.clone().sub(currentPosition);
      const distance = direction.length();

      if (distance > 0.01) {
        // Move toward target position
        direction.normalize();
        const speed = 5;
        clonedScene.position.add(direction.multiplyScalar(speed * delta));

        // Smooth rotation toward movement direction
        const targetQuternion = new THREE.Quaternion();
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(
          clonedScene.position,
          targetPosition,
          new THREE.Vector3(0, 1, 0)
        );
        targetQuternion.setFromRotationMatrix(lookAtMatrix);

        const flip = new THREE.Quaternion();
        flip.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        targetQuternion.multiply(flip);
        clonedScene.quaternion.slerp(targetQuternion, 0.1);
      } else {
        useGameStore.getState().clearTargetPosition(id);
      }
    }
  });

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={clonedScene} />;
}
