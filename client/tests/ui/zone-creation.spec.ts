import { expect, test } from '@playwright/test';

import {
  dragBetweenWorldPoints,
  gotoGame,
  waitForSceneReady,
} from '../helpers/sprenity-ui';

test('build mode creates a zone from a drag gesture', async ({ page }) => {
  await gotoGame(page);
  await waitForSceneReady(page);
  const zoneLabels = page.locator('[data-zone-label]');
  const initialCount = await zoneLabels.count();

  await page.getByTestId('mode-toggle').click();
  await expect(page.getByTestId('mode-toggle')).toHaveText('EXIT BUILD');

  await dragBetweenWorldPoints(
    page,
    { x: -8, y: 0, z: -8 },
    { x: -6, y: 0, z: -6 }
  );

  await expect(zoneLabels).toHaveCount(initialCount + 1);
});
