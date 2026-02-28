import {
  createPortal,
  useFrame,
  useThree,
  type RootState,
} from '@react-three/fiber';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import * as THREE from 'three';
import {
  ThreeViewRegistryContext,
  useThreeViewRegistry,
  type ThreeViewEntry,
} from './three-view-registry-context';

export function ThreeViewRegistryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [viewMap, setViewMap] = useState<Map<string, ThreeViewEntry>>(
    () => new Map(),
  );

  const registerView = useCallback((entry: ThreeViewEntry) => {
    setViewMap((prev) => {
      const next = new Map(prev);
      next.set(entry.id, entry);
      return next;
    });
  }, []);

  const updateView = useCallback(
    (id: string, patch: Partial<ThreeViewEntry>) => {
      setViewMap((prev) => {
        const current = prev.get(id);
        if (!current) return prev;
        const next = new Map(prev);
        next.set(id, { ...current, ...patch });
        return next;
      });
    },
    [],
  );

  const unregisterView = useCallback((id: string) => {
    setViewMap((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const views = useMemo(() => Array.from(viewMap.values()), [viewMap]);

  return (
    <ThreeViewRegistryContext.Provider
      value={{ views, registerView, updateView, unregisterView }}
    >
      {children}
    </ThreeViewRegistryContext.Provider>
  );
}

export function ThreeViewRegistryRenderer() {
  const { views } = useThreeViewRegistry();
  const sortedViews = useMemo(() => {
    return [...views].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }, [views]);

  return (
    <>
      {sortedViews.map((view) => (
        <TrackedView
          key={view.id}
          track={view.track}
          index={view.priority}
          frames={view.frames}
          visible={view.visible}
          camera={view.camera}
        >
          {view.element}
        </TrackedView>
      ))}
    </>
  );
}

type TrackedViewProps = {
  track: RefObject<HTMLElement | null>;
  visible?: boolean;
  index?: number;
  frames?: number;
  camera?: THREE.Camera;
  children?: ReactNode;
};

const isOrthographicCamera = (
  camera: THREE.Camera | undefined,
): camera is THREE.OrthographicCamera =>
  Boolean(
    camera && 'isOrthographicCamera' in camera && camera.isOrthographicCamera,
  );

const scissorColor = new THREE.Color();

function computeContainerPosition(
  canvasSize: RootState['size'],
  trackRect: DOMRect,
) {
  const { right, top, left, width, height } = trackRect;
  const isOffscreen =
    trackRect.bottom < 0 ||
    top > canvasSize.height ||
    right < 0 ||
    left > canvasSize.width;
  const canvasBottom = canvasSize.top + canvasSize.height;
  const bottomPos = canvasBottom - trackRect.bottom;
  const leftPos = left - canvasSize.left;
  return {
    position: {
      width,
      height,
      left: leftPos,
      top,
      bottom: bottomPos,
      right,
    },
    isOffscreen,
  };
}

function prepareScissor(
  state: RootState,
  position: { left: number; bottom: number; width: number; height: number },
) {
  const aspect = position.width / position.height;
  if (isOrthographicCamera(state.camera)) {
    if (!state.camera.manual) {
      if (
        state.camera.left !== position.width / -2 ||
        state.camera.right !== position.width / 2 ||
        state.camera.top !== position.height / 2 ||
        state.camera.bottom !== position.height / -2
      ) {
        Object.assign(state.camera, {
          left: position.width / -2,
          right: position.width / 2,
          top: position.height / 2,
          bottom: position.height / -2,
        });
        state.camera.updateProjectionMatrix();
      }
    } else {
      state.camera.updateProjectionMatrix();
    }
  } else if (!Number.isNaN(aspect) && state.camera.aspect !== aspect) {
    state.camera.aspect = aspect;
    state.camera.updateProjectionMatrix();
  }
  const autoClear = state.gl.autoClear;
  state.gl.autoClear = false;
  state.gl.setViewport(
    position.left,
    position.bottom,
    position.width,
    position.height,
  );
  state.gl.setScissor(
    position.left,
    position.bottom,
    position.width,
    position.height,
  );
  state.gl.setScissorTest(true);
  return autoClear;
}

function finishScissor(state: RootState, autoClear: boolean) {
  state.gl.setScissorTest(false);
  state.gl.autoClear = autoClear;
}

function clearScissor(state: RootState) {
  state.gl.getClearColor(scissorColor);
  state.gl.setClearColor(scissorColor, state.gl.getClearAlpha());
  state.gl.clear(true, true);
}

type ViewContainerProps = {
  visible: boolean;
  canvasSize: RootState['size'];
  scene: RootState['scene'];
  index: number;
  children?: ReactNode;
  frames: number;
  rect: MutableRefObject<DOMRect | null>;
  track: RefObject<HTMLElement | null>;
};

function ViewContainer({
  visible,
  canvasSize,
  scene,
  index,
  children,
  frames,
  rect,
  track,
}: ViewContainerProps) {
  const rootState = useThree();
  const [isOffscreen, setOffscreen] = useState(false);
  const frameCount = useRef(0);

  useFrame((state) => {
    if (frames === Infinity || frameCount.current <= frames) {
      rect.current = track.current?.getBoundingClientRect() ?? null;
      frameCount.current += 1;
    }
    if (rect.current) {
      const { position, isOffscreen: offscreen } = computeContainerPosition(
        canvasSize,
        rect.current,
      );
      if (isOffscreen !== offscreen) setOffscreen(offscreen);
      if (visible && !offscreen) {
        const autoClear = prepareScissor(state, position);
        state.gl.render(children ? state.scene : scene, state.camera);
        finishScissor(state, autoClear);
      }
    }
  }, index);

  useLayoutEffect(() => {
    const currentRect = rect.current;
    if (currentRect && (!visible || !isOffscreen)) {
      const { position } = computeContainerPosition(canvasSize, currentRect);
      const autoClear = prepareScissor(rootState, position);
      clearScissor(rootState);
      finishScissor(rootState, autoClear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isOffscreen]);

  useEffect(() => {
    if (!track) return;
    const currentRect = rect.current;
    const previous = rootState.get().events.connected;
    rootState.setEvents({
      connected: track.current ?? undefined,
    });
    return () => {
      if (currentRect) {
        const { position } = computeContainerPosition(canvasSize, currentRect);
        const autoClear = prepareScissor(rootState, position);
        clearScissor(rootState);
        finishScissor(rootState, autoClear);
      }
      rootState.setEvents({
        connected: previous,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  return (
    <>
      {children}
      <group onPointerOver={() => null} />
    </>
  );
}

function TrackedView({
  track,
  visible = true,
  index = 1,
  frames = Infinity,
  camera,
  children,
}: TrackedViewProps) {
  const rect = useRef<DOMRect | null>(null);
  const [initialSize] = useState(() => {
    const r = track.current?.getBoundingClientRect();
    return {
      width: r?.width ?? 0,
      height: r?.height ?? 0,
      top: r?.top ?? 0,
      left: r?.left ?? 0,
    };
  });
  const { size, scene } = useThree();
  const [virtualScene] = useState(() => new THREE.Scene());
  const [ready, markReady] = useReducer(() => true, false);
  useEffect(() => {
    rect.current = track.current?.getBoundingClientRect() ?? null;
    markReady();
  }, [track]);

  const compute = (event: PointerEvent | MouseEvent | WheelEvent, state: RootState) => {
    const el = track.current;
    if (el && event.target === el) {
      const { width, height, left, top } = el.getBoundingClientRect();
      const x = event.clientX - left;
      const y = event.clientY - top;
      state.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, state.camera);
    }
  };
  const portalState: Parameters<typeof createPortal>[2] = {
    events: { compute, priority: index },
    size: initialSize,
  };
  if (camera) {
    portalState.camera = camera as THREE.PerspectiveCamera;
  }

  return (
    <group>
      {ready &&
        createPortal(
          <ViewContainer
            visible={visible}
            canvasSize={size}
            scene={scene}
            index={index}
            frames={frames}
            rect={rect}
            track={track}
          >
            {children}
          </ViewContainer>,
          virtualScene,
          portalState,
        )}
    </group>
  );
}
