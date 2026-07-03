import { test, expect } from '@playwright/test';

test.describe('Vanilla shop demo', () => {
  test('loads products and agent panel', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Shop Demo' })).toBeVisible();
    await expect(page.getByText('Pro Laptop')).toBeVisible();
    await expect(page.getByText('Budget Laptop')).toBeVisible();
    await expect(page.locator('.app-agent-panel')).toBeVisible();
  });

  test('adds item to cart', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await expect(page.locator('#cart-count')).toHaveText('1');
  });
});
