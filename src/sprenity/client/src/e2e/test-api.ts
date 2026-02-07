import * as THREE from 'three';

import { useGameStore } from '@core/store/game-store';
import { useInteractionStore } from '@core/store/interaction-store';

type Vector3Like = {
  x: number;
  y: number;
  z: number;
};

export type AgentSnapshot = {
  id: string;
  name: string;
  position: Vector3Like;
  targetPosition: Vector3Like | null;
};

export type ScreenPoint = {
  x: number;
  y: number;
  inViewport: boolean;
};

export interface SprenityTestApi {
  getAgents: () => AgentSnapshot[];
  getSelectedAgentIds: () => string[];
  isInteractionLocked: () => boolean;
  worldToScreen: (world: Vector3Like) => ScreenPoint | null;
  isSceneReady: () => boolean;
}

let sceneCamera: THREE.Camera | null = null;
let trackElement: HTMLElement | null = null;
let requiredAgentIds = new Set<string>(['ranger1', 'ranger2']);

const isE2EEnabled = () => {
  if (typeof window === 'undefined') return false;

  const e2eValue = new URLSearchParams(window.location.search).get('e2e');
  if (e2eValue === null) return false;
  return e2eValue !== '0' && e2eValue.toLowerCase() !== 'false';
};

const toVector3Like = (vector: THREE.Vector3): Vector3Like => ({
  x: vector.x,
  y: vector.y,
  z: vector.z,
});

const testApi: SprenityTestApi = {
  getAgents: () => {
    const state = useGameStore.getState();
    return Array.from(state.agentsMap.values()).map((agent) => ({
      id: agent.id,
      name: agent.name,
      position: toVector3Like(agent.object.position),
      targetPosition: agent.targetPosition ? toVector3Like(agent.targetPosition) : null,
    }));
  },

  getSelectedAgentIds: () => {
    const state = useGameStore.getState();
    return Array.from(state.selectedAgentId);
  },

  isInteractionLocked: () => useInteractionStore.getState().locked,

  worldToScreen: (world) => {
    if (!sceneCamera || !trackElement) return null;

    const rect = trackElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    sceneCamera.updateMatrixWorld();
    const projected = new THREE.Vector3(world.x, world.y, world.z).project(
      sceneCamera
    );

    if (
      !Number.isFinite(projected.x) ||
      !Number.isFinite(projected.y) ||
      !Number.isFinite(projected.z)
    ) {
      return null;
    }

    return {
      x: rect.left + ((projected.x + 1) / 2) * rect.width,
      y: rect.top + ((-projected.y + 1) / 2) * rect.height,
      inViewport: projected.z >= -1 && projected.z <= 1,
    };
  },

  isSceneReady: () => {
    const state = useGameStore.getState();

    if (requiredAgentIds.size === 0) {
      return state.agentsMap.size > 0;
    }

    for (const agentId of requiredAgentIds) {
      const agent = state.agentsMap.get(agentId);
      if (!agent?.object) return false;
    }

    return true;
  },
};

export const setupSprenityTestApi = () => {
  if (typeof window === 'undefined') return;

  if (!isE2EEnabled()) {
    delete window.__sprenityTestApi;
    return;
  }

  window.__sprenityTestApi = testApi;
};

export const setSceneCameraForTests = (camera: THREE.Camera | null) => {
  sceneCamera = camera;
};

export const setTrackElementForTests = (element: HTMLElement | null) => {
  trackElement = element;
};

export const setRequiredAgentsForTests = (agentIds: string[]) => {
  requiredAgentIds = new Set(agentIds);
};
