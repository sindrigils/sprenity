import { OrbitControls, View } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useAgents, useUpdateAgent } from '@api/agents/hooks';
import { useDeleteZone, useUpdateZone } from '@api/zones/hooks';
import { useGameStore } from '@core/store/game-store';
import { useInteractionLocked } from '@core/store/interaction-store';
import { useTerminalStore } from '@core/store/terminal-store';
import { Agent } from '@entities/agent';
import { BoxSelection } from '@systems/selection/box-selection';
import { ClickableGround, InfiniteGrid, ZoomClamp } from '@systems/world';
import { Zones } from '@systems/zones';
import {
  AgentTerminalSidebar,
  ModeToggle,
  ZoneBuildNotification,
} from '@ui/controls';
import { ModalProvider, useModal } from '@ui/modals';
import {
  setRequiredAgentsForTests,
  setSceneCameraForTests,
  setTrackElementForTests,
} from './e2e/test-api';

type GameCanvasProps = {
  eventSource: HTMLDivElement | null;
  gameTrackRef: RefObject<HTMLDivElement | null>;
  labelLayoutVersion: number;
};

function GameCanvas({
  eventSource,
  gameTrackRef,
  labelLayoutVersion,
}: GameCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { openModal } = useModal();
  const isLocked = useInteractionLocked();
  const { data: agents = [] } = useAgents();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        const state = useGameStore.getState();
        if (state.selectedAgentId.size > 0) {
          const firstSelectedId = Array.from(state.selectedAgentId)[0];
          const agent = agents.find((a) => a.id === firstSelectedId);
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
  }, [openModal, isLocked, agents]);

  return (
    <Canvas
      className="absolute inset-0"
      data-testid="game-canvas"
      frameloop="always"
      orthographic
      camera={{ zoom: 64, position: [20, 20, 20], near: 0.1, far: 5000 }}
      eventSource={eventSource ?? undefined}
      eventPrefix="client"
    >
      <View track={gameTrackRef as RefObject<HTMLElement>}>
        <GameScene
          controlsRef={controlsRef}
          gameTrackRef={gameTrackRef}
          labelLayoutVersion={labelLayoutVersion}
        />
      </View>
      <View.Port />
    </Canvas>
  );
}

type GameSceneProps = {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  gameTrackRef: RefObject<HTMLDivElement | null>;
  labelLayoutVersion: number;
};

function GameScene({
  controlsRef,
  gameTrackRef,
  labelLayoutVersion,
}: GameSceneProps) {
  const camera = useThree((state) => state.camera);
  const eventsConnected = useThree((state) => state.events.connected);
  const isLocked = useInteractionLocked();
  const { data: agents = [] } = useAgents();

  useEffect(() => {
    setSceneCameraForTests(camera);
    return () => setSceneCameraForTests(null);
  }, [camera]);

  useEffect(() => {
    setRequiredAgentsForTests(agents.map((a) => a.id));
  }, [agents]);

  return (
    <>
      <color attach="background" args={['#2A2B38']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      {agents.map((agent) => (
        <Agent
          key={agent.id}
          id={agent.id}
          name={agent.name}
          characterModel={agent.characterModel}
          position={[0, 0, 0]}
          labelPortalRef={gameTrackRef}
          labelLayoutVersion={labelLayoutVersion}
        />
      ))}
      <InfiniteGrid />
      <Zones boundsRef={gameTrackRef} />
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
    </>
  );
}

export default function App() {
  const updateAgentMutation = useUpdateAgent();
  const updateZoneMutation = useUpdateZone();
  const deleteZoneMutation = useDeleteZone();
  const hasActiveTerminal = useTerminalStore(
    (state) => state.activeAgentId !== null && state.activeAgentName !== null,
  );
  const [labelLayoutVersion, setLabelLayoutVersion] = useState(0);
  const [eventSource, setEventSource] = useState<HTMLDivElement | null>(null);
  const [trackElement, setTrackElement] = useState<HTMLDivElement | null>(null);
  const gameTrackRef = useRef<HTMLDivElement>(null);
  const setGameTrackRef = useCallback((element: HTMLDivElement | null) => {
    gameTrackRef.current = element;
    setTrackElement(element);
    setTrackElementForTests(element);
  }, []);

  useEffect(() => {
    if (!trackElement) return;

    let previousWidth = Math.round(trackElement.getBoundingClientRect().width);
    let previousHeight = Math.round(
      trackElement.getBoundingClientRect().height,
    );
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width === previousWidth && height === previousHeight) return;

      previousWidth = width;
      previousHeight = height;
      setLabelLayoutVersion((version) => version + 1);
    });

    observer.observe(trackElement);
    return () => observer.disconnect();
  }, [trackElement]);

  return (
    <div data-testid="app-root" className="h-full w-full">
      <ModalProvider
        onSaveAgentConfig={(agentId, data) => {
          updateAgentMutation.mutate({ id: agentId, body: data });
        }}
        onSaveZoneProject={(zoneId, data) => {
          updateZoneMutation.mutate({ id: zoneId, body: data });
        }}
        onDeleteZoneProject={(zoneId) => {
          deleteZoneMutation.mutate(zoneId);
        }}
      >
        <div
          ref={setEventSource}
          className="relative h-full w-full overflow-hidden"
        >
          <GameCanvas
            eventSource={eventSource}
            gameTrackRef={gameTrackRef}
            labelLayoutVersion={labelLayoutVersion}
          />
          <div
            className="absolute inset-y-0 left-0 z-10 transition-[right] duration-[220ms] ease-out"
            style={{ right: hasActiveTerminal ? 520 : 0 }}
          >
            <div
              ref={setGameTrackRef}
              data-testid="game-track"
              className="absolute inset-0"
            />
            <ZoneBuildNotification />
            <ModeToggle />
          </div>
          <AgentTerminalSidebar isOpen={hasActiveTerminal} />
        </div>
      </ModalProvider>
    </div>
  );
}
