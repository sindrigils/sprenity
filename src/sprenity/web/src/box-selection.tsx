import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';
import { useGameStore } from './store/game-store';

function findSelectableRoot(object: THREE.Object3D): THREE.Object3D | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.selectable) return current;
    current = current.parent;
  }
  return null;
}

export function BoxSelection() {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    const selectionBox = new SelectionBox(camera, scene);

    // Create our own selection visual (instead of SelectionHelper which doesn't filter by button)
    const boxElement = document.createElement('div');
    boxElement.style.cssText = `
      border: 2px solid #55aaff;
      background-color: rgba(75, 160, 255, 0.3);
      position: fixed;
      pointer-events: none;
      display: none;
    `;
    document.body.appendChild(boxElement);

    let isSelecting = false;
    let startX = 0;
    let startY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return; // Only left click

      isSelecting = true;
      startX = event.clientX;
      startY = event.clientY;

      boxElement.style.left = `${startX}px`;
      boxElement.style.top = `${startY}px`;
      boxElement.style.width = '0px';
      boxElement.style.height = '0px';
      boxElement.style.display = 'block';

      const rect = gl.domElement.getBoundingClientRect();
      selectionBox.startPoint.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
        0.5
      );
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isSelecting) return;

      const left = Math.min(startX, event.clientX);
      const top = Math.min(startY, event.clientY);
      const width = Math.abs(event.clientX - startX);
      const height = Math.abs(event.clientY - startY);

      boxElement.style.left = `${left}px`;
      boxElement.style.top = `${top}px`;
      boxElement.style.width = `${width}px`;
      boxElement.style.height = `${height}px`;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.button !== 0 || !isSelecting) return;

      isSelecting = false;
      boxElement.style.display = 'none';

      const dragDistance = Math.hypot(
        event.clientX - startX,
        event.clientY - startY
      );
      if (dragDistance < 5) return;

      const rect = gl.domElement.getBoundingClientRect();
      selectionBox.endPoint.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
        0.5
      );

      const allSelected = selectionBox.select();
      const selectableRoots = new Set<THREE.Object3D>();

      for (const obj of allSelected) {
        const root = findSelectableRoot(obj);
        if (root) selectableRoots.add(root);
      }

      const selected = Array.from(selectableRoots);
      selected.forEach((obj) => {
        const id = obj.userData.id;
        if (id) {
          useGameStore.getState().setSelectedAgentId(id);
        }
      });
    };

    gl.domElement.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    return () => {
      gl.domElement.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      boxElement.remove();
    };
  }, [camera, gl, scene]);

  return null;
}
