import { useGameStore, type GridCell } from '@core/store/game-store';
import { useInteractionLocked } from '@core/store/interaction-store';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, type RefObject } from 'react';
import * as THREE from 'three';
import {
  normalizeCells,
  touchesOrOverlapsAnyZone,
  worldToGridCell,
  ZONE_COLORS,
} from './zone-utils';

type ZoneBuilderProps = {
  boundsRef?: RefObject<HTMLElement | null>;
};

const DRAG_THRESHOLD_PX = 5;

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'button, input, textarea, select, a, [role="button"], [contenteditable="true"], [data-ui-control], [data-zone-label]'
    )
  );
}

export function ZoneBuilder({ boundsRef }: ZoneBuilderProps) {
  const { camera, gl } = useThree();
  const eventsConnected = useThree((state) => state.events.connected);
  const isLocked = useInteractionLocked();
  const interactionMode = useGameStore((state) => state.interactionMode);
  const zoneCounter = useGameStore((state) => state.zoneCounter);
  const setZoneDragStart = useGameStore((state) => state.setZoneDragStart);
  const setZoneDragEnd = useGameStore((state) => state.setZoneDragEnd);
  const clearZoneDrag = useGameStore((state) => state.clearZoneDrag);
  const setActiveHoverCell = useGameStore((state) => state.setActiveHoverCell);
  const clearActiveHoverCell = useGameStore(
    (state) => state.clearActiveHoverCell
  );
  const clearHoverTrail = useGameStore((state) => state.clearHoverTrail);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);
  const groundPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    []
  );
  const previewColor = ZONE_COLORS[zoneCounter % ZONE_COLORS.length];

  useEffect(() => {
    if (isLocked || interactionMode !== 'build') {
      clearZoneDrag();
      clearHoverTrail();
      return;
    }

    let isDragging = false;
    let dragStartCell: GridCell | null = null;
    let dragEndCell: GridCell | null = null;
    let pointerDownClientX = 0;
    let pointerDownClientY = 0;

    const getViewportRect = () =>
      boundsRef?.current?.getBoundingClientRect() ??
      gl.domElement.getBoundingClientRect();

    const isWithinBounds = (event: PointerEvent) => {
      const rect = getViewportRect();
      return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
    };

    const raycastToGround = (clientX: number, clientY: number) => {
      const rect = getViewportRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(groundPlane, intersection)) {
        return null;
      }

      return intersection.clone();
    };

    const clearLocalDrag = () => {
      isDragging = false;
      dragStartCell = null;
      dragEndCell = null;
      pointerDownClientX = 0;
      pointerDownClientY = 0;
      clearZoneDrag();
    };

    const finalizeDrag = (pointerUpClientX: number, pointerUpClientY: number) => {
      if (!dragStartCell) {
        clearLocalDrag();
        return;
      }

      const endCell = dragEndCell ?? dragStartCell;
      const dragDistance = Math.hypot(
        pointerUpClientX - pointerDownClientX,
        pointerUpClientY - pointerDownClientY
      );
      const cellChanged =
        dragStartCell.x !== endCell.x || dragStartCell.z !== endCell.z;
      const shouldCreateZone =
        dragDistance >= DRAG_THRESHOLD_PX && cellChanged;

      if (!shouldCreateZone) {
        clearLocalDrag();
        return;
      }

      const { startCell, endCell: normalizedEndCell } = normalizeCells(
        dragStartCell,
        endCell
      );

      const state = useGameStore.getState();
      const hasConflictingZone = touchesOrOverlapsAnyZone(
        startCell,
        normalizedEndCell,
        state.zones.values()
      );
      if (hasConflictingZone) {
        state.showZoneBuildNotification(
          'Zone cannot overlap or touch another zone.'
        );
        clearLocalDrag();
        return;
      }

      const zoneCounter = state.zoneCounter;
      state.addZone({
        id: crypto.randomUUID(),
        name: `Project ${zoneCounter + 1}`,
        startCell,
        endCell: normalizedEndCell,
        color: ZONE_COLORS[zoneCounter % ZONE_COLORS.length],
      });

      clearLocalDrag();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;
      if (!isWithinBounds(event)) return;

      const point = raycastToGround(event.clientX, event.clientY);
      if (!point) return;

      const cell = worldToGridCell(point);
      isDragging = true;
      dragStartCell = cell;
      dragEndCell = cell;
      pointerDownClientX = event.clientX;
      pointerDownClientY = event.clientY;
      clearZoneDrag();
      setActiveHoverCell(cell, previewColor, performance.now());
    };

    const onPointerMove = (event: PointerEvent) => {
      const withinBounds = isWithinBounds(event);
      const overInteractiveTarget = isInteractiveTarget(event.target);
      const nowMs = performance.now();

      if (!withinBounds || overInteractiveTarget) {
        clearActiveHoverCell(nowMs);
        if (!isDragging) return;
        return;
      }

      const point = raycastToGround(event.clientX, event.clientY);
      if (!point) {
        clearActiveHoverCell(nowMs);
        if (!isDragging) return;
        return;
      }

      const cell = worldToGridCell(point);
      setActiveHoverCell(cell, previewColor, nowMs);

      if (!isDragging) return;

      dragEndCell = cell;
      const dragDistance = Math.hypot(
        event.clientX - pointerDownClientX,
        event.clientY - pointerDownClientY
      );

      if (dragDistance >= DRAG_THRESHOLD_PX && dragStartCell) {
        setZoneDragStart(dragStartCell);
        setZoneDragEnd(cell);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!isDragging) return;
      const dragDistance = Math.hypot(
        event.clientX - pointerDownClientX,
        event.clientY - pointerDownClientY
      );

      if (isWithinBounds(event) && dragDistance >= DRAG_THRESHOLD_PX) {
        const point = raycastToGround(event.clientX, event.clientY);
        if (point) {
          const cell = worldToGridCell(point);
          dragEndCell = cell;
          setZoneDragEnd(cell);
        }
      }

      finalizeDrag(event.clientX, event.clientY);
    };

    const onPointerCancel = () => {
      if (isDragging) {
        clearLocalDrag();
      }
      clearHoverTrail();
    };

    const onWindowBlur = () => {
      if (isDragging) {
        clearLocalDrag();
      }
      clearHoverTrail();
    };

    const eventTarget = (eventsConnected || gl.domElement) as HTMLElement;
    eventTarget.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      eventTarget.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('blur', onWindowBlur);
      clearLocalDrag();
      clearHoverTrail();
    };
  }, [
    boundsRef,
    camera,
    clearActiveHoverCell,
    clearHoverTrail,
    clearZoneDrag,
    eventsConnected,
    gl,
    groundPlane,
    interactionMode,
    intersection,
    isLocked,
    ndc,
    previewColor,
    raycaster,
    setActiveHoverCell,
    setZoneDragEnd,
    setZoneDragStart,
  ]);

  return null;
}
