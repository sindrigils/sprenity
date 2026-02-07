import { create } from 'zustand';

type InteractionState = {
  locked: boolean;
  setLocked: (locked: boolean) => void;
};

export const useInteractionStore = create<InteractionState>((set) => ({
  locked: false,
  setLocked: (locked) => set({ locked }),
}));

export const useInteractionLocked = () =>
  useInteractionStore((state) => state.locked);
