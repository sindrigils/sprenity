import { expect, type Page } from '@playwright/test';

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type AgentSnapshot = {
  id: string;
  name: string;
  position: Vector3;
  targetPosition: Vector3 | null;
};

type ScreenPoint = {
  x: number;
  y: number;
  inViewport: boolean;
};

const ensureTestApiAvailable = async (page: Page) => {
  await expect
    .poll(
      async () =>
        page.evaluate(() =>
          Boolean(window.__sprenityTestApi)
        ),
      { timeout: 10_000 }
    )
    .toBe(true);
};

export const gotoGame = async (page: Page) => {
  await page.goto('/?e2e=1');
  await ensureTestApiAvailable(page);
};

export const waitForSceneReady = async (page: Page) => {
  await expect
    .poll(
      async () =>
        page.evaluate(() => window.__sprenityTestApi?.isSceneReady() ?? false),
      {
        timeout: 45_000,
        message: '3D scene did not become ready in time',
      }
    )
    .toBe(true);
};

export const getAgents = async (page: Page): Promise<AgentSnapshot[]> => {
  const agents = await page.evaluate(
    () => window.__sprenityTestApi?.getAgents() ?? null
  );

  if (!agents) {
    throw new Error('Sprenity test API unavailable: getAgents returned null');
  }

  return agents;
};

export const getSelectedAgentIds = async (page: Page): Promise<string[]> => {
  const selectedIds = await page.evaluate(
    () => window.__sprenityTestApi?.getSelectedAgentIds() ?? null
  );

  if (!selectedIds) {
    throw new Error(
      'Sprenity test API unavailable: getSelectedAgentIds returned null'
    );
  }

  return selectedIds;
};

export const isInteractionLocked = async (page: Page): Promise<boolean> => {
  const locked = await page.evaluate(
    () => window.__sprenityTestApi?.isInteractionLocked() ?? null
  );

  if (locked === null) {
    throw new Error(
      'Sprenity test API unavailable: isInteractionLocked returned null'
    );
  }

  return locked;
};

export const worldToScreen = async (
  page: Page,
  world: Vector3
): Promise<ScreenPoint> => {
  const point = await page.evaluate(
    (input) => window.__sprenityTestApi?.worldToScreen(input) ?? null,
    world
  );

  if (!point) {
    throw new Error('Failed to project world coordinate into screen space');
  }

  return point;
};

export const clickWorld = async (page: Page, world: Vector3) => {
  const point = await worldToScreen(page, world);

  if (!point.inViewport) {
    throw new Error('World click target is outside viewport');
  }

  await page.mouse.click(point.x, point.y);
};

export const dragBetweenWorldPoints = async (
  page: Page,
  a: Vector3,
  b: Vector3,
  steps = 8
) => {
  const pointA = await worldToScreen(page, a);
  const pointB = await worldToScreen(page, b);

  if (!pointA.inViewport || !pointB.inViewport) {
    throw new Error('Drag points are outside viewport');
  }

  await page.mouse.move(pointA.x, pointA.y);
  await page.mouse.down();
  await page.mouse.move(pointB.x, pointB.y, { steps });
  await page.mouse.up();
};

export const dispatchWorldClickToGameTrack = async (
  page: Page,
  world: Vector3
) => {
  const result = await page.evaluate((targetWorld) => {
    const testApi = window.__sprenityTestApi;
    const track = document.querySelector('[data-testid="game-track"]');
    if (!testApi) {
      return { ok: false, reason: 'Sprenity test API is unavailable' };
    }
    if (!(track instanceof HTMLElement)) {
      return { ok: false, reason: 'Game track element not found' };
    }

    const point = testApi.worldToScreen(targetWorld);
    if (!point || !point.inViewport) {
      return { ok: false, reason: 'Projected point is out of viewport' };
    }

    const pointerDown = new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: point.x,
      clientY: point.y,
      pointerId: 1,
      pointerType: 'mouse',
    });
    const pointerUp = new PointerEvent('pointerup', {
      bubbles: true,
      button: 0,
      clientX: point.x,
      clientY: point.y,
      pointerId: 1,
      pointerType: 'mouse',
    });
    const click = new MouseEvent('click', {
      bubbles: true,
      button: 0,
      clientX: point.x,
      clientY: point.y,
    });

    track.dispatchEvent(pointerDown);
    track.dispatchEvent(pointerUp);
    track.dispatchEvent(click);

    return { ok: true };
  }, world);

  if (!result.ok) {
    throw new Error(`Failed to dispatch world click: ${result.reason}`);
  }
};

export const dragSelectBetweenWorldPoints = async (
  page: Page,
  a: Vector3,
  b: Vector3,
  padding = 24
) => {
  const pointA = await worldToScreen(page, a);
  const pointB = await worldToScreen(page, b);

  if (!pointA.inViewport || !pointB.inViewport) {
    throw new Error('Selection points are outside viewport');
  }

  const startX = Math.min(pointA.x, pointB.x) - padding;
  const startY = Math.min(pointA.y, pointB.y) - padding;
  const endX = Math.max(pointA.x, pointB.x) + padding;
  const endY = Math.max(pointA.y, pointB.y) + padding;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 8 });
  await page.mouse.up();
};

export const dragSelectAroundWorldPoint = async (
  page: Page,
  world: Vector3,
  radius = 18
) => {
  const point = await worldToScreen(page, world);

  if (!point.inViewport) {
    throw new Error('Selection point is outside viewport');
  }

  await page.mouse.move(point.x - radius, point.y - radius);
  await page.mouse.down();
  await page.mouse.move(point.x + radius, point.y + radius, { steps: 6 });
  await page.mouse.up();
};

export const waitForSelectionCount = async (
  page: Page,
  minimumCount: number
): Promise<string[]> => {
  await expect
    .poll(async () => (await getSelectedAgentIds(page)).length, {
      timeout: 10_000,
    })
    .toBeGreaterThanOrEqual(minimumCount);

  return getSelectedAgentIds(page);
};

export const movementDistance = (a: Vector3, b: Vector3) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
