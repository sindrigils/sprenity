import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {
  useAnimations,
  useCharacterModel,
  type CharacterModel,
} from '@core/hooks';

type PreviewModelProps = {
  model: CharacterModel;
};

function PreviewModel({ model }: PreviewModelProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Load the character model and animations
  const scene = useCharacterModel(model);
  const { getClip } = useAnimations();

  // Clone the scene so we don't modify the cached original
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);

    // Clone materials
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material = child.material.clone();
      }
    });

    return clone;
  }, [scene]);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    const idleClip = getClip('Idle_A');
    let action: THREE.AnimationAction | undefined;
    if (idleClip) {
      action = mixer.clipAction(idleClip);
      action.play();
    }

    return () => {
      if (action) {
        action.stop();
      }
      mixer.stopAllAction();
    };
  }, [clonedScene, getClip]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={clonedScene} />;
}

function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial color="#2a2a2a" />
    </mesh>
  );
}

type AgentPreviewProps = {
  model?: CharacterModel;
};

export function AgentPreview({ model = 'Ranger' }: AgentPreviewProps) {
  return (
    <Canvas
      camera={{
        position: [0, 1, 4.5],
        fov: 45,
      }}
      style={{ background: '#0a0a0c' }}
    >
      <fog attach="fog" args={['#0a0a0c', 3, 12]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      <PreviewModel model={model} />
      <Ground />

      <OrbitControls
        target={[0, 0.9, 0]}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI / 2}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </Canvas>
  );
}
