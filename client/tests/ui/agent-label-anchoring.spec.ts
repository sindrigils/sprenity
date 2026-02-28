import { expect, test, type Page } from '@playwright/test';
import {
  getAgents,
  gotoGame,
  waitForSceneReady,
  worldToScreen,
} from '../helpers/sprenity-ui';

const LABEL_HEIGHT_OFFSET = 3.1;

const getLabelCenter = async (page: Page, agentId: string) => {
  const box = await page.getByTestId(`agent-name-${agentId}`).boundingBox();
  if (!box) {
    throw new Error(`Label for agent "${agentId}" is not visible`);
  }
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
};

const getAnchorPoint = async (page: Page, agentId: string) => {
  const agents = await getAgents(page);
  const agent = agents.find((entry) => entry.id === agentId);
  if (!agent) {
    throw new Error(`Agent "${agentId}" not found`);
  }
  return worldToScreen(page, {
    x: agent.position.x,
    y: agent.position.y + LABEL_HEIGHT_OFFSET,
    z: agent.position.z,
  });
};

const labelAnchorDistance = async (page: Page, agentId: string) => {
  const labelCenter = await getLabelCenter(page, agentId);
  const anchor = await getAnchorPoint(page, agentId);
  return Math.hypot(labelCenter.x - anchor.x, labelCenter.y - anchor.y);
};

test('agent labels stay anchored after viewport resize', async ({ page }) => {
  await gotoGame(page);
  await waitForSceneReady(page);

  const tolerancePx = 20;
  await expect
    .poll(async () => labelAnchorDistance(page, 'ranger1'))
    .toBeLessThan(tolerancePx);

  await page.setViewportSize({ width: 1100, height: 780 });
  await expect
    .poll(async () => labelAnchorDistance(page, 'ranger1'))
    .toBeLessThan(tolerancePx);

  await page.setViewportSize({ width: 1400, height: 900 });
  await expect
    .poll(async () => labelAnchorDistance(page, 'ranger1'))
    .toBeLessThan(tolerancePx);
});
