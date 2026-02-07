import { expect, test } from '@playwright/test';

import {
  clickWorld,
  dragSelectBetweenWorldPoints,
  getAgents,
  getSelectedAgentIds,
  gotoGame,
  movementDistance,
  waitForSceneReady,
  waitForSelectionCount,
} from '../helpers/sprenity-ui';

test('box selection and move command updates selected agents @smoke', async ({
  page,
}) => {
  await gotoGame(page);
  await waitForSceneReady(page);

  const initialAgents = await getAgents(page);
  const ranger1 = initialAgents.find((agent) => agent.id === 'ranger1');
  const ranger2 = initialAgents.find((agent) => agent.id === 'ranger2');

  expect(ranger1).toBeDefined();
  expect(ranger2).toBeDefined();

  await dragSelectBetweenWorldPoints(page, ranger1!.position, ranger2!.position, 30);

  const selectedIds = await waitForSelectionCount(page, 2);
  expect(selectedIds).toEqual(expect.arrayContaining(['ranger1', 'ranger2']));

  const beforeById = new Map(initialAgents.map((agent) => [agent.id, agent.position]));
  await page.waitForTimeout(250);

  const selectedAfterDragRelease = await getSelectedAgentIds(page);
  expect(selectedAfterDragRelease).toHaveLength(2);
  expect(selectedAfterDragRelease).toEqual(expect.arrayContaining(selectedIds));

  const agentsAfterDragRelease = await getAgents(page);
  const hadUnintendedMoveAfterDragRelease = selectedIds.some((id) => {
    const before = beforeById.get(id);
    const after = agentsAfterDragRelease.find((agent) => agent.id === id);

    if (!before || !after) return true;

    return (
      after.targetPosition !== null || movementDistance(before, after.position) > 0.2
    );
  });
  expect(hadUnintendedMoveAfterDragRelease).toBe(false);

  await clickWorld(page, { x: 0, y: 0, z: 5 });

  await expect.poll(async () => (await getSelectedAgentIds(page)).length).toBe(0);

  await expect
    .poll(async () => {
      const afterAgents = await getAgents(page);
      return selectedIds.some((id) => {
        const before = beforeById.get(id);
        const after = afterAgents.find((agent) => agent.id === id);

        if (!before || !after) return false;

        return (
          after.targetPosition !== null ||
          movementDistance(before, after.position) > 0.35
        );
      });
    })
    .toBe(true);
});
