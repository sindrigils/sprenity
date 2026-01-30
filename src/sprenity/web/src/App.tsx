import { Grid, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function Ranger() {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Load the Ranger model
  const { scene } = useGLTF('/assets/characters/Ranger.glb');

  // Load animations
  const { animations } = useGLTF(
    '/assets/animations/Rig_Medium_MovementBasic.glb'
  );

  useEffect(() => {
    // Find armature in Ranger
    let armature: THREE.Object3D | null = null;
    scene.traverse((obj) => {
      if (obj.name === 'Rig_Medium' && obj.type === 'Object3D') {
        armature = obj;
      }
    });

    if (!armature) {
      console.error('No armature found!');
      return;
    }

    // Create mixer on the armature
    const mixer = new THREE.AnimationMixer(armature);
    mixerRef.current = mixer;

    // Play walking animation
    const walkClip = animations.find((clip) => clip.name === 'Walking_A');
    if (walkClip) {
      const action = mixer.clipAction(walkClip);
      action.play();
    }

    return () => mixer.stopAllAction();
  }, [scene, animations]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={scene} />;
}

function Ground() {
  return (
    <group>
      {/* Solid ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Grid lines on top */}
      <Grid
        args={[100, 100]}
        cellSize={2}
        cellColor="#9999aa"
        sectionSize={2}
        sectionColor="#9999aa"
        cellThickness={0.8}
        sectionThickness={0.8}
      />
    </group>
  );
}

export default function App() {
  return (
    <Canvas orthographic camera={{ zoom: 100, position: [10, 10, 10] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Ranger />
      <Ground />
      <OrbitControls target={[0, 1, 0]} />
    </Canvas>
  );
}
