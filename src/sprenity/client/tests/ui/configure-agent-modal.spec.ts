import { expect, test } from '@playwright/test';

import {
  dragSelectAroundWorldPoint,
  getAgents,
  getSelectedAgentIds,
  gotoGame,
  waitForSceneReady,
} from '../helpers/sprenity-ui';

test('configure modal opens with selected agent data and persists saved values @smoke', async ({
  page,
}) => {
  await gotoGame(page);
  await waitForSceneReady(page);

  const agents = await getAgents(page);
  const ranger1 = agents.find((agent) => agent.id === 'ranger1');

  expect(ranger1).toBeDefined();

  await dragSelectAroundWorldPoint(page, ranger1!.position);

  await expect.poll(async () => await getSelectedAgentIds(page)).toContain('ranger1');

  await page.keyboard.press('e');

  const modal = page.getByTestId('configure-agent-modal');
  await expect(modal).toBeVisible();

  const nameInput = page.getByTestId('configure-agent-name-input');
  const modelSelect = page.getByTestId('configure-agent-model-select');
  const characterSelect = page.getByTestId('configure-agent-character-select');

  await expect(nameInput).toHaveValue('Ranger 1');
  await expect(modelSelect).toHaveValue('claude-sonnet');
  await expect(characterSelect).toHaveValue('Ranger');

  await nameInput.fill('Ranger Prime');
  await modelSelect.selectOption('claude-haiku');
  await characterSelect.selectOption('Knight');

  await page.getByTestId('configure-agent-save').click();
  await expect(modal).toBeHidden();

  await page.keyboard.press('e');
  await expect(modal).toBeVisible();

  await expect(nameInput).toHaveValue('Ranger Prime');
  await expect(modelSelect).toHaveValue('claude-haiku');
  await expect(characterSelect).toHaveValue('Knight');

  await page.getByTestId('configure-agent-close').click();
  await expect(modal).toBeHidden();
});
