import { OrbitControls, View } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useGameStore } from '@core/store/game-store';
import { Agent } from '@entities/agent';
import { BoxSelection } from '@systems/selection/box-selection';
import { ClickableGround, InfiniteGrid, ZoomClamp } from '@systems/world';
import { useInteractionLocked } from '@core/store/interaction-store';
import { ModalProvider, useModal } from '@ui/modals';
import {
  ThreeViewRegistryProvider,
  ThreeViewRegistryRenderer,
} from '@ui/three-view-registry';

type GameCanvasProps = {
  eventSource: HTMLDivElement | null;
  gameTrackRef: RefObject<HTMLDivElement>;
};

function GameCanvas({ eventSource, gameTrackRef }: GameCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { openModal } = useModal();
  const isLocked = useInteractionLocked();

  // Keyboard handler for "e" key to open configure modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;

      // Skip if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        const state = useGameStore.getState();
        if (state.selectedAgentId.size > 0) {
          const firstSelectedId = Array.from(state.selectedAgentId)[0];
          const agent = state.agentsMap.get(firstSelectedId);
          if (agent) {
            openModal('configure-agent', {
              agentId: agent.id,
              name: agent.name,
              model: agent.model || 'claude-sonnet',
              characterModel: agent.characterModel,
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openModal, isLocked]);

  return (
    <Canvas
      orthographic
      camera={{ zoom: 64, position: [20, 20, 20], near: 0.1, far: 5000 }}
      eventSource={eventSource ?? undefined}
      eventPrefix="client"
    >
      <GameScene
        controlsRef={controlsRef}
        gameTrackRef={gameTrackRef}
      />
      <ThreeViewRegistryRenderer />
    </Canvas>
  );
}

type GameSceneProps = {
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  gameTrackRef: RefObject<HTMLDivElement>;
};

function GameScene({ controlsRef, gameTrackRef }: GameSceneProps) {
  const eventsConnected = useThree((state) => state.events.connected);
  const isLocked = useInteractionLocked();

  return (
    <View track={gameTrackRef}>
      <color attach="background" args={['#2A2B38']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Agent
        id="ranger1"
        name="Ranger 1"
        characterModel="Ranger"
        position={[-2, 0, 0]}
      />
      <Agent
        id="ranger2"
        name="Ranger 2"
        characterModel="Ranger"
        position={[2, 0, 0]}
      />
      <InfiniteGrid />
      <ClickableGround />
      <BoxSelection boundsRef={gameTrackRef} />
      <ZoomClamp controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        domElement={eventsConnected ?? undefined}
        enabled={!isLocked}
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
    </View>
  );
}

export default function App() {
  const updateAgentConfig = useGameStore((state) => state.updateAgentConfig);
  const [eventSource, setEventSource] = useState<HTMLDivElement | null>(null);
  const gameTrackRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={setEventSource} className="relative h-full w-full">
      <ThreeViewRegistryProvider>
        <ModalProvider onSaveAgentConfig={updateAgentConfig}>
          <GameCanvas eventSource={eventSource} gameTrackRef={gameTrackRef} />
        </ModalProvider>
      </ThreeViewRegistryProvider>
      <div ref={gameTrackRef} className="absolute inset-0 z-10" />
    </div>
  );
}
