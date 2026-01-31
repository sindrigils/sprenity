import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BoxSelection } from './box-selection';
import { Ranger } from './ranger';
import { useGameStore } from './store/game-store';

const GRID_VERTEX_SHADER = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const GRID_FRAGMENT_SHADER = `
uniform vec3 uGroundColor;
uniform vec3 uLineColor;
uniform float uCellSize;
uniform float uLineWidth;
varying vec3 vWorldPosition;

void main() {
  vec2 coord = vWorldPosition.xz / uCellSize;
  vec2 grid = abs(fract(coord - 0.5) - 0.5) / (fwidth(coord) * uLineWidth);
  float line = min(grid.x, grid.y);
  float gridAlpha = 1.0 - min(line, 1.0);
  vec3 color = mix(uGroundColor, uLineColor, gridAlpha);
  gl_FragColor = vec4(color, 1.0);
}
`;

function ClickableGround() {
  const selectedAgentId = useGameStore((state) => state.selectedAgentId);
  const moveSelectedAgentTo = useGameStore(
    (state) => state.moveSelectedAgentTo
  );
  const clearSelectedAgentIds = useGameStore(
    (state) => state.clearSelectedAgentIds
  );

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position-y={0}
      onClick={
        selectedAgentId.size > 0
          ? (e) => {
              e.stopPropagation();
              moveSelectedAgentTo(e.point);
              clearSelectedAgentIds();
            }
          : undefined
      }
    >
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

function InfiniteGrid() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const groundPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    []
  );
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);
  const screenCoord = useMemo(() => new THREE.Vector2(), []);
  const uniforms = useMemo(
    () => ({
      uGroundColor: { value: new THREE.Color('#2A2B38') },
      uLineColor: { value: new THREE.Color('#56565c') },
      uCellSize: { value: 2 },
      uLineWidth: { value: 1 },
    }),
    []
  );

  useFrame(() => {
    if (!meshRef.current) {
      return;
    }

    camera.updateMatrixWorld();

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    const corners: Array<[number, number]> = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];

    for (const [sx, sy] of corners) {
      raycaster.setFromCamera(screenCoord.set(sx, sy), camera);
      if (!raycaster.ray.intersectPlane(groundPlane, intersection)) {
        return;
      }
      minX = Math.min(minX, intersection.x);
      maxX = Math.max(maxX, intersection.x);
      minZ = Math.min(minZ, intersection.z);
      maxZ = Math.max(maxZ, intersection.z);
    }

    const centerX = (minX + maxX) * 0.5;
    const centerZ = (minZ + maxZ) * 0.5;
    const width = Math.max(maxX - minX, 1);
    const depth = Math.max(maxZ - minZ, 1);
    const margin = 1.5;

    meshRef.current.position.set(centerX, 0, centerZ);
    meshRef.current.scale.set(width * margin, depth * margin, 1);
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={GRID_VERTEX_SHADER}
        fragmentShader={GRID_FRAGMENT_SHADER}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas orthographic camera={{ zoom: 100, position: [10, 10, 10] }}>
      <color attach="background" args={['#2A2B38']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Ranger id="ranger1" position={[-2, 0, 0]} />
      <Ranger id="ranger2" position={[2, 0, 0]} />
      <InfiniteGrid />
      <ClickableGround />
      <BoxSelection />
      <OrbitControls
        enableRotate={false}
        enableZoom={true}
        enablePan={true}
        minZoom={10}
        screenSpacePanning={false}
        mouseButtons={{
          LEFT: null as unknown as THREE.MOUSE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </Canvas>
  );
}
