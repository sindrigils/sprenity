import { createContext, useContext, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';

export type ThreeViewEntry = {
  id: string;
  track: RefObject<HTMLElement | null>;
  element: ReactNode;
  priority?: number;
  frames?: number;
  visible?: boolean;
  camera?: THREE.Camera;
};

type ThreeViewRegistryContextValue = {
  views: ThreeViewEntry[];
  registerView: (entry: ThreeViewEntry) => void;
  updateView: (id: string, patch: Partial<ThreeViewEntry>) => void;
  unregisterView: (id: string) => void;
};

export const ThreeViewRegistryContext =
  createContext<ThreeViewRegistryContextValue | null>(null);

export function useThreeViewRegistry() {
  const context = useContext(ThreeViewRegistryContext);
  if (!context) {
    throw new Error(
      'useThreeViewRegistry must be used within ThreeViewRegistryProvider',
    );
  }
  return context;
}
