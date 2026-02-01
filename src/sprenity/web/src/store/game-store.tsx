import * as THREE from 'three';
import { create } from 'zustand';
import type { CharacterModel } from '../hooks';

export interface Agent {
  id: string;
  name: string;
  model: string;
  characterModel: CharacterModel;
  object: THREE.Object3D;
  targetPosition: THREE.Vector3 | null;
}
interface GameStore {
  // Map of all agents
  agentsMap: Map<string, Agent>;

  selectedAgentId: Set<string>;

  registerAgent: (
    id: string,
    name: string,
    characterModel: CharacterModel,
    object: THREE.Object3D
  ) => void;
  unregisterAgent: (id: string) => void;
  updateAgentObject: (id: string, object: THREE.Object3D) => void;
  setSelectedAgentId: (id: string) => void;
  clearSelectedAgentIds: () => void;
  moveSelectedAgentTo: (worldPosition: THREE.Vector3) => void;
  clearTargetPosition: (id: string) => void;
  updateAgentConfig: (
    id: string,
    data: { name: string; model: string; characterModel: CharacterModel }
  ) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initialize state
  agentsMap: new Map<string, Agent>(),
  selectedAgentId: new Set<string>(),

  // Actions
  registerAgent: (
    id: string,
    name: string,
    characterModel: CharacterModel,
    object: THREE.Object3D
  ) => {
    set((state) => {
      const newMap = new Map(state.agentsMap);
      newMap.set(id, {
        id,
        name,
        model: '',
        characterModel,
        object,
        targetPosition: null,
      });
      return { agentsMap: newMap };
    });
  },

  unregisterAgent: (id: string) => {
    set((state) => {
      const newMap = new Map(state.agentsMap);
      newMap.delete(id);
      const newSet = new Set(state.selectedAgentId);
      newSet.delete(id);
      return { agentsMap: newMap, selectedAgentId: newSet };
    });
  },

  updateAgentObject: (id: string, object: THREE.Object3D) => {
    set((state) => {
      const newMap = new Map(state.agentsMap);
      const agent = newMap.get(id);
      if (agent) {
        newMap.set(id, { ...agent, object });
      }
      return { agentsMap: newMap };
    });
  },

  setSelectedAgentId: (id: string) => {
    set((state) => {
      const newSet = new Set(state.selectedAgentId);
      newSet.add(id);
      return { selectedAgentId: newSet };
    });
  },

  clearSelectedAgentIds: () => {
    set({ selectedAgentId: new Set<string>() });
  },

  moveSelectedAgentTo: (worldPosition: THREE.Vector3) => {
    const state = get();
    const selectedAgentIds = Array.from(state.selectedAgentId);
    const numAgents = selectedAgentIds.length;

    if (numAgents === 0) return;

    // Generate spread positions
    const spreadPositions: THREE.Vector3[] = [];
    if (numAgents === 1) {
      spreadPositions.push(worldPosition.clone());
    } else {
      const radius = 1.5;
      for (let i = 0; i < numAgents; i++) {
        const angle = (i / numAgents) * Math.PI * 2;
        spreadPositions.push(
          worldPosition
            .clone()
            .add(
              new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
              )
            )
        );
      }
    }

    // Sort agents by distance - FURTHEST first
    const agentsByDistance = selectedAgentIds
      .map((id) => {
        const agent = state.agentsMap.get(id);
        const distance = agent?.object.position.distanceTo(worldPosition) || 0;
        return { id, distance };
      })
      .sort((a, b) => b.distance - a.distance);

    // Furthest agent picks closest spread position first
    const availablePositions = [...spreadPositions];
    const assignments = new Map<string, THREE.Vector3>();

    for (const { id } of agentsByDistance) {
      const agent = state.agentsMap.get(id);
      if (!agent) continue;

      // Find closest available spread position
      let closestIdx = 0;
      let closestDist = Infinity;
      for (let i = 0; i < availablePositions.length; i++) {
        const dist = agent.object.position.distanceTo(availablePositions[i]);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      assignments.set(id, availablePositions[closestIdx]);
      availablePositions.splice(closestIdx, 1);
    }

    set((prevState) => {
      const newMap = new Map(prevState.agentsMap);
      for (const [id, targetPos] of assignments) {
        const agent = newMap.get(id);
        if (agent) {
          newMap.set(id, { ...agent, targetPosition: targetPos });
        }
      }
      return { agentsMap: newMap };
    });
  },

  clearTargetPosition: (id: string) => {
    set((state) => {
      const newMap = new Map(state.agentsMap);
      const agent = newMap.get(id);
      if (agent) {
        agent.targetPosition = null;
        newMap.set(id, agent);
      }
      return { agentsMap: newMap };
    });
  },

  updateAgentConfig: (
    id: string,
    data: { name: string; model: string; characterModel: CharacterModel }
  ) => {
    set((state) => {
      const newMap = new Map(state.agentsMap);
      const agent = newMap.get(id);
      if (agent) {
        newMap.set(id, {
          ...agent,
          name: data.name,
          model: data.model,
          characterModel: data.characterModel,
        });
      }
      return { agentsMap: newMap };
    });
  },
}));
