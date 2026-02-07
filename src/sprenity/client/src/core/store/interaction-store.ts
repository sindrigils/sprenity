import { create } from 'zustand';

type InteractionState = {
  locked: boolean;
  suppressGroundClickUntilMs: number;
  setLocked: (locked: boolean) => void;
  suppressGroundClickFor: (durationMs: number) => void;
  consumeGroundClickSuppression: (nowMs: number) => boolean;
};

export const useInteractionStore = create<InteractionState>((set, get) => ({
  locked: false,
  suppressGroundClickUntilMs: 0,
  setLocked: (locked) => set({ locked }),
  suppressGroundClickFor: (durationMs) =>
    set({ suppressGroundClickUntilMs: performance.now() + durationMs }),
  consumeGroundClickSuppression: (nowMs) => {
    const untilMs = get().suppressGroundClickUntilMs;
    if (untilMs <= 0) {
      return false;
    }

    set({ suppressGroundClickUntilMs: 0 });
    return nowMs <= untilMs;
  },
}));

export const useInteractionLocked = () =>
  useInteractionStore((state) => state.locked);
