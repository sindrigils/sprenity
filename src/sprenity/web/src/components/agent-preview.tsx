import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import type { CharacterModel } from '../agent';

type PreviewModelProps = {
  model: CharacterModel;
};

function PreviewModel({ model }: PreviewModelProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Load the character model
  const { scene } = useGLTF(`/assets/characters/${model}.glb`);

  // Load animations - need both files to get Idle_A
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

    const idleClip = allAnimations.find((clip) => clip.name === 'Idle_A');
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
  }, [clonedScene, allAnimations]);

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

// Preload assets
useGLTF.preload('/assets/characters/Barbarian.glb');
useGLTF.preload('/assets/characters/Knight.glb');
useGLTF.preload('/assets/characters/Mage.glb');
useGLTF.preload('/assets/characters/Ranger.glb');
useGLTF.preload('/assets/characters/Rogue.glb');
useGLTF.preload('/assets/characters/Rogue_Hooded.glb');
useGLTF.preload('/assets/animations/Rig_Medium_MovementBasic.glb');
useGLTF.preload('/assets/animations/Rig_Medium_General.glb');
