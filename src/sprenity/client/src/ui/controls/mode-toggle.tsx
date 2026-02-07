import { useCallback, useEffect } from 'react';
import { useGameStore } from '@core/store/game-store';
import { useInteractionLocked } from '@core/store/interaction-store';

export function ModeToggle() {
  const interactionMode = useGameStore((state) => state.interactionMode);
  const setInteractionMode = useGameStore((state) => state.setInteractionMode);
  const isLocked = useInteractionLocked();

  const isBuildMode = interactionMode === 'build';
  const toggleMode = useCallback(() => {
    setInteractionMode(isBuildMode ? 'normal' : 'build');
  }, [isBuildMode, setInteractionMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey || event.key !== 'Tab') return;
      if (isLocked) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      event.preventDefault();
      toggleMode();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLocked, toggleMode]);

  return (
    <button
      type="button"
      data-ui-control
      data-testid="mode-toggle"
      className="absolute bottom-[10px] left-1/2 z-50 -translate-x-1/2 rounded-md border border-cyan-300/40 bg-slate-900/85 px-4 py-2 text-xs font-bold tracking-[0.08em] text-cyan-100 transition-colors hover:bg-slate-800/90"
      onClick={(event) => {
        event.stopPropagation();
        toggleMode();
      }}
    >
      {isBuildMode ? 'EXIT BUILD' : 'ADD ZONE'}
    </button>
  );
}
