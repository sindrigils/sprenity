import { useCreateAgent } from '@api/agents/hooks';
import { useGameStore } from '@core/store/game-store';
import { useInteractionLocked } from '@core/store/interaction-store';
import { useCallback, useEffect } from 'react';

const btnClass =
  'rounded-md border border-cyan-300/40 bg-slate-900/85 px-4 py-2 text-xs font-bold tracking-[0.08em] text-cyan-100 transition-colors hover:bg-slate-800/90';

export function ModeToggle() {
  const interactionMode = useGameStore((state) => state.interactionMode);
  const setInteractionMode = useGameStore((state) => state.setInteractionMode);
  const isLocked = useInteractionLocked();
  const createAgent = useCreateAgent();

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
    <div className="absolute bottom-[10px] left-1/2 z-50 flex -translate-x-1/2 gap-2">
      <button
        type="button"
        data-ui-control
        data-testid="add-agent"
        className={btnClass}
        onClick={(event) => {
          event.stopPropagation();
          createAgent.mutate({ name: `Agent ${Date.now().toString(36)}` });
        }}
      >
        ADD AGENT
      </button>
      <button
        type="button"
        data-ui-control
        data-testid="mode-toggle"
        className={btnClass}
        onClick={(event) => {
          event.stopPropagation();
          toggleMode();
        }}
      >
        {isBuildMode ? 'EXIT BUILD' : 'ADD ZONE'}
      </button>
    </div>
  );
}
