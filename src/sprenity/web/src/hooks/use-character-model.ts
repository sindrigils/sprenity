import { useGLTF } from '@react-three/drei';

export const CHARACTER_MODELS = [
  'Barbarian',
  'Knight',
  'Mage',
  'Ranger',
  'Rogue',
  'Rogue_Hooded',
] as const;

export type CharacterModel = (typeof CHARACTER_MODELS)[number];

export function useCharacterModel(model: CharacterModel) {
  const { scene } = useGLTF(`/assets/characters/${model}.glb`);
  return scene;
}

// Preload all character models
for (const model of CHARACTER_MODELS) {
  useGLTF.preload(`/assets/characters/${model}.glb`);
}
