import { expect, test } from '@playwright/test';

import {
  clickWorld,
  dispatchWorldClickToGameTrack,
  dragSelectAroundWorldPoint,
  getAgents,
  getSelectedAgentIds,
  gotoGame,
  isInteractionLocked,
  movementDistance,
  waitForSceneReady,
} from '../helpers/sprenity-ui';

test('modal lock blocks world interactions until modal closes @smoke', async ({
  page,
}) => {
  await gotoGame(page);
  await waitForSceneReady(page);

  const initialAgents = await getAgents(page);
  const ranger1 = initialAgents.find((agent) => agent.id === 'ranger1');

  expect(ranger1).toBeDefined();

  await dragSelectAroundWorldPoint(page, ranger1!.position);
  await expect.poll(async () => await getSelectedAgentIds(page)).toContain('ranger1');

  await page.keyboard.press('e');
  const modal = page.getByTestId('configure-agent-modal');
  await expect(modal).toBeVisible();

  await expect.poll(async () => await isInteractionLocked(page)).toBe(true);

  const beforeLockedClick = await getAgents(page);

  await dispatchWorldClickToGameTrack(page, { x: 4, y: 0, z: 6 });
  await page.waitForTimeout(200);

  const selectedWhileLocked = await getSelectedAgentIds(page);
  if (selectedWhileLocked.length > 0) {
    expect(selectedWhileLocked).toContain('ranger1');
  }

  const afterLockedClick = await getAgents(page);
  const rangerAfterLockedClick = afterLockedClick.find(
    (agent) => agent.id === 'ranger1'
  );
  const rangerBeforeLockedClick = beforeLockedClick.find(
    (agent) => agent.id === 'ranger1'
  );

  expect(rangerAfterLockedClick).toBeDefined();
  expect(rangerBeforeLockedClick).toBeDefined();
  expect(rangerAfterLockedClick!.targetPosition).toBeNull();
  expect(
    movementDistance(rangerBeforeLockedClick!.position, rangerAfterLockedClick!.position)
  ).toBeLessThan(0.05);

  await page.getByTestId('configure-agent-close').click();
  await expect(modal).toBeHidden();
  await expect.poll(async () => await isInteractionLocked(page)).toBe(false);

  // Some flows clear selection while the modal is open; ensure one agent is selected
  // before validating unlocked move behavior.
  const selectedAfterClose = await getSelectedAgentIds(page);
  if (!selectedAfterClose.includes('ranger1')) {
    const latestAgents = await getAgents(page);
    const latestRanger1 = latestAgents.find((agent) => agent.id === 'ranger1');
    expect(latestRanger1).toBeDefined();
    await dragSelectAroundWorldPoint(page, latestRanger1!.position);
    await expect.poll(async () => await getSelectedAgentIds(page)).toContain('ranger1');
  }

  await clickWorld(page, { x: 4, y: 0, z: 6 });

  await expect.poll(async () => (await getSelectedAgentIds(page)).length).toBe(0);
  await expect
    .poll(async () => {
      const afterUnlockedClick = await getAgents(page);
      const ranger = afterUnlockedClick.find((agent) => agent.id === 'ranger1');
      if (!ranger || !rangerBeforeLockedClick) return false;
      return (
        ranger.targetPosition !== null ||
        movementDistance(rangerBeforeLockedClick.position, ranger.position) > 0.25
      );
    })
    .toBe(true);
});

test('pressing E or ground click with no selection does nothing @smoke', async ({
  page,
}) => {
  await gotoGame(page);
  await waitForSceneReady(page);

  await expect.poll(async () => (await getSelectedAgentIds(page)).length).toBe(0);

  await page.keyboard.press('e');
  await expect(page.getByTestId('configure-agent-modal')).toHaveCount(0);

  const beforeClick = await getAgents(page);
  await clickWorld(page, { x: 0, y: 0, z: 4 });
  await page.waitForTimeout(200);

  const afterClick = await getAgents(page);

  expect(afterClick.every((agent) => agent.targetPosition === null)).toBe(true);

  for (const previous of beforeClick) {
    const current = afterClick.find((agent) => agent.id === previous.id);
    expect(current).toBeDefined();
    expect(movementDistance(previous.position, current!.position)).toBeLessThan(0.05);
  }
});
