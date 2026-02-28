import { useGLTF } from '@react-three/drei';
import type { CharacterModel } from '@api/agents/requests';

export type { CharacterModel };

export const CHARACTER_MODELS: CharacterModel[] = [
  'Barbarian',
  'Knight',
  'Mage',
  'Ranger',
  'Rogue',
  'Rogue_Hooded',
];

export function useCharacterModel(model: CharacterModel) {
  const { scene } = useGLTF(`/assets/characters/${model}.glb`);
  return scene;
}

// Preload all character models
for (const model of CHARACTER_MODELS) {
  useGLTF.preload(`/assets/characters/${model}.glb`);
}
