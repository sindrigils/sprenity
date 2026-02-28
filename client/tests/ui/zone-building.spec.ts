import { expect, test } from '@playwright/test';

import {
  dragBetweenWorldPoints,
  gotoGame,
  waitForSceneReady,
} from '../helpers/sprenity-ui';

test('build mode rejects overlapping and touching zones', async ({ page }) => {
  await gotoGame(page);
  await waitForSceneReady(page);
  const zoneLabels = page.locator('[data-zone-label]');
  const initialCount = await zoneLabels.count();

  await page.getByTestId('mode-toggle').click();
  await expect(page.getByTestId('mode-toggle')).toHaveText('EXIT BUILD');

  await dragBetweenWorldPoints(
    page,
    { x: -6, y: 0, z: -6 },
    { x: -5, y: 0, z: -5 }
  );
  await expect(zoneLabels).toHaveCount(initialCount + 1);

  await dragBetweenWorldPoints(
    page,
    { x: -6, y: 0, z: -6 },
    { x: -5, y: 0, z: -5 }
  );
  await expect(page.getByTestId('zone-build-notification')).toHaveText(
    'Zone cannot overlap or touch another zone.'
  );
  await expect(zoneLabels).toHaveCount(initialCount + 1);

  await dragBetweenWorldPoints(
    page,
    { x: -4, y: 0, z: -6 },
    { x: -3, y: 0, z: -5 }
  );
  await expect(page.getByTestId('zone-build-notification')).toHaveText(
    'Zone cannot overlap or touch another zone.'
  );
  await expect(zoneLabels).toHaveCount(initialCount + 1);
});
