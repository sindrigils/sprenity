import { useGameStore } from '@core/store/game-store';
import { useEffect } from 'react';

const AUTO_DISMISS_MS = 2400;

export function ZoneBuildNotification() {
  const zoneBuildNotification = useGameStore(
    (state) => state.zoneBuildNotification
  );
  const clearZoneBuildNotification = useGameStore(
    (state) => state.clearZoneBuildNotification
  );

  useEffect(() => {
    if (!zoneBuildNotification) return;

    const timeoutId = window.setTimeout(() => {
      const currentNotification = useGameStore.getState().zoneBuildNotification;
      if (currentNotification?.id === zoneBuildNotification.id) {
        clearZoneBuildNotification();
      }
    }, AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clearZoneBuildNotification, zoneBuildNotification]);

  if (!zoneBuildNotification) {
    return null;
  }

  return (
    <div
      data-testid="zone-build-notification"
      className="pointer-events-none absolute bottom-[48px] left-1/2 z-50 -translate-x-1/2 rounded border border-rose-300/35 bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-rose-100 shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
    >
      {zoneBuildNotification.message}
    </div>
  );
}
