import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
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
  const { camera, size } = useThree();
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
    let hasAllIntersections = true;

    const corners: Array<[number, number]> = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];

    const parallelEpsilon = 1e-6;

    for (const [sx, sy] of corners) {
      raycaster.setFromCamera(screenCoord.set(sx, sy), camera);
      const { origin, direction } = raycaster.ray;
      if (Math.abs(direction.y) < parallelEpsilon) {
        hasAllIntersections = false;
        break;
      }

      const t = -origin.y / direction.y;
      intersection.copy(direction).multiplyScalar(t).add(origin);
      minX = Math.min(minX, intersection.x);
      maxX = Math.max(maxX, intersection.x);
      minZ = Math.min(minZ, intersection.z);
      maxZ = Math.max(maxZ, intersection.z);
    }

    const margin = 2.5;

    if (
      !hasAllIntersections ||
      !Number.isFinite(minX) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(minZ) ||
      !Number.isFinite(maxZ)
    ) {
      // Fallback: keep a large grid centered on the view so we never expose the background.
      raycaster.setFromCamera(screenCoord.set(0, 0), camera);
      const { origin, direction } = raycaster.ray;
      if (Math.abs(direction.y) >= parallelEpsilon) {
        const t = -origin.y / direction.y;
        intersection.copy(direction).multiplyScalar(t).add(origin);
        meshRef.current.position.set(intersection.x, 0, intersection.z);
      } else {
        meshRef.current.position.set(0, 0, 0);
      }

      const safeZoom = Math.max(camera.zoom, 1);
      const viewWidth = size.width / safeZoom;
      const viewHeight = size.height / safeZoom;
      const fallbackScale = Math.max(viewWidth, viewHeight, 1) * margin * 6;
      meshRef.current.scale.set(fallbackScale, fallbackScale, 1);
      return;
    }

    const centerX = (minX + maxX) * 0.5;
    const centerZ = (minZ + maxZ) * 0.5;
    const width = Math.max(maxX - minX, 1);
    const depth = Math.max(maxZ - minZ, 1);

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

type ZoomClampProps = {
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  baseMinZoom?: number;
  safety?: number;
};

function ZoomClamp({
  controlsRef,
  baseMinZoom = 8,
  safety = 1.03,
}: ZoomClampProps) {
  const size = useThree((state) => state.size);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
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

export default function App() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <Canvas
      orthographic
      camera={{ zoom: 64, position: [20, 20, 20], near: 0.1, far: 5000 }}
    >
      <color attach="background" args={['#2A2B38']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Ranger id="ranger1" position={[-2, 0, 0]} />
      <Ranger id="ranger2" position={[2, 0, 0]} />
      <InfiniteGrid />
      <ClickableGround />
      <BoxSelection />
      <ZoomClamp controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enableRotate={false}
        enableZoom={true}
        enablePan={true}
        minZoom={8}
        maxZoom={64}
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
