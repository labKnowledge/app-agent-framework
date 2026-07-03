import { test, expect } from '@playwright/test';

test.describe('React shop demo', () => {
  test('loads products and agent UI', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'React Shop Demo' })).toBeVisible();
    await expect(page.getByText('Pro Laptop')).toBeVisible();
    await expect(page.locator('.app-agent-panel')).toBeVisible();
  });

  test('ask agent button triggers execute without error', async ({ page }) => {
    await page.goto('/');
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.getByRole('button', { name: 'Ask agent' }).first().click();
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });
});
