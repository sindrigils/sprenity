import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useGameStore } from '@core/store/game-store';
import { Agent } from '@entities/agent';
import { BoxSelection } from '@systems/selection/box-selection';
import { ClickableGround, InfiniteGrid, ZoomClamp } from '@systems/world';
import { ModalProvider, useModal } from '@ui/modals';

function GameCanvas() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { openModal } = useModal();

  // Keyboard handler for "e" key to open configure modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [openModal]);

  return (
    <Canvas
      orthographic
      camera={{ zoom: 64, position: [20, 20, 20], near: 0.1, far: 5000 }}
    >
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

export default function App() {
  const updateAgentConfig = useGameStore((state) => state.updateAgentConfig);

  return (
    <ModalProvider onSaveAgentConfig={updateAgentConfig}>
      <GameCanvas />
    </ModalProvider>
  );
}
