import { expect, test } from '@playwright/test';

import {
  clickWorld,
  getAgents,
  gotoGame,
  waitForSceneReady,
} from '../helpers/sprenity-ui';

test('clicking an agent opens the terminal sidebar and shrinks viewport @smoke', async ({
  page,
}) => {
  await gotoGame(page);
  await waitForSceneReady(page);

  const trackBefore = await page.getByTestId('game-track').boundingBox();
  expect(trackBefore).toBeTruthy();

  const agents = await getAgents(page);
  const ranger1 = agents.find((agent) => agent.id === 'ranger1');
  expect(ranger1).toBeDefined();

  await clickWorld(page, {
    x: ranger1!.position.x,
    y: 1,
    z: ranger1!.position.z,
  });

  const sidebar = page.getByTestId('agent-terminal-sidebar');
  await expect(sidebar).toBeVisible();
  await expect(page.getByTestId('agent-terminal-surface')).toBeVisible();

  await expect
    .poll(
      async () =>
        (await page.getByTestId('game-track').boundingBox())?.width ?? 0,
      { timeout: 2_000 },
    )
    .toBeLessThan(trackBefore!.width - 400);

  await page.getByTestId('agent-terminal-close').click();
  await expect
    .poll(
      async () =>
        Number.parseFloat(
          await sidebar.evaluate((element) => getComputedStyle(element).width),
        ),
      { timeout: 2_000 },
    )
    .toBeLessThanOrEqual(1);

  await expect
    .poll(
      async () =>
        (await page.getByTestId('game-track').boundingBox())?.width ?? 0,
      { timeout: 2_000 },
    )
    .toBeGreaterThan(trackBefore!.width - 2);
});
