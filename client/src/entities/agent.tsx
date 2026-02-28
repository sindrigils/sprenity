import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CharacterModel } from '@api/agents/requests';
import { useAnimations, useCharacterModel, useClonedModel } from '@core/hooks';
import { useGameStore } from '@core/store/game-store';

type AgentProps = {
  id: string;
  name: string;
  characterModel: CharacterModel;
  position: [number, number, number];
};

export function Agent({
  id,
  name,
  characterModel,
  position = [0, 0, 0],
}: AgentProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const nameTagRef = useRef<THREE.Group>(null);
  const isSelected = useGameStore((state) => state.selectedAgentId.has(id));

  const registerAgent = useGameStore((state) => state.registerAgent);
  const unregisterAgent = useGameStore((state) => state.unregisterAgent);
  const updateAgentObject = useGameStore((state) => state.updateAgentObject);

  const scene = useCharacterModel(characterModel);
  const clonedScene = useClonedModel(scene, id, position);
  const { getClip } = useAnimations();

  const targetPosition = useGameStore(
    (state) => state.agentsMap.get(id)?.targetPosition,
  );

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    const idleClip = getClip('Idle_A');
    const runningClip = getClip('Running_A');
    if (targetPosition && runningClip) {
      const action = mixer.clipAction(runningClip);
      action.play();
    } else if (idleClip) {
      const action = mixer.clipAction(idleClip);
      action.play();
    }
  }, [clonedScene, getClip, targetPosition]);

  // Register on mount, unregister on unmount
  useEffect(() => {
    registerAgent(id, clonedScene);
    return () => unregisterAgent(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Update object when clonedScene changes (e.g., when characterModel changes)
  useEffect(() => {
    updateAgentObject(id, clonedScene);
  }, [id, clonedScene, updateAgentObject]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
    if (targetPosition) {
      const currentPosition = clonedScene.position;
      const direction = targetPosition.clone().sub(currentPosition);
      const distance = direction.length();

      if (distance > 0.01) {
        direction.normalize();
        const speed = 5;
        clonedScene.position.add(direction.multiplyScalar(speed * delta));

        const targetQuternion = new THREE.Quaternion();
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(
          clonedScene.position,
          targetPosition,
          new THREE.Vector3(0, 1, 0),
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

    if (nameTagRef.current) {
      nameTagRef.current.position.copy(clonedScene.position);
    }
  });

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return (
    <>
      <primitive object={clonedScene} />
      <group ref={nameTagRef} position={position}>
        {isSelected ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.45, 0.62, 48]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.95}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        ) : null}
        <Html
          position={[0, 3.1, 0]}
          transform
          center
          sprite
          zIndexRange={[40, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            data-testid={`agent-name-${id}`}
            style={{
              color: '#7BEA52',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {name}
          </div>
        </Html>
      </group>
    </>
  );
}
