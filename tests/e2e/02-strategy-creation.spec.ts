import { test, expect } from '@playwright/test';

test.describe('Strategy Creation & Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="login-email-input"]', 'admin@tradepro.com');
    await page.fill('[data-testid="login-password-input"]', 'admin123');
    await page.click('[data-testid="login-submit-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('create a new strategy with visual builder', async ({ page }) => {
    // Navigate to strategies
    await page.click('[data-testid="nav-strategies"]');
    await expect(page).toHaveURL('/strategies');

    // Click new strategy button
    await page.click('[data-testid="new-strategy-button"]');
    await expect(page).toHaveURL('/strategy-builder');

    // Enter strategy name
    const strategyName = `Test Strategy ${Date.now()}`;
    await page.fill('[data-testid="strategy-name-input"]', strategyName);

    // Add nodes from library
    await page.click('[data-testid="add-node-indicator-0"]'); // RSI
    await page.click('[data-testid="add-node-condition-4"]'); // Greater Than
    await page.click('[data-testid="add-node-action-8"]'); // Buy

    // Verify canvas has nodes
    await expect(page.locator('[data-testid="strategy-canvas"]')).toBeVisible();

    // Save strategy
    await page.click('[data-testid="save-strategy-button"]');

    // Verify success toast
    await expect(page.locator('text=Strategy saved successfully!')).toBeVisible({ timeout: 5000 });
  });

  test('view and manage existing strategies', async ({ page }) => {
    await page.click('[data-testid="nav-strategies"]');
    
    // Wait for strategies to load
    await page.waitForSelector('[data-testid="strategies-page"]');

    // Check if strategies exist or show empty state
    const hasStrategies = await page.locator('[data-testid^="strategy-card-"]').count() > 0;
    
    if (hasStrategies) {
      // Click on first strategy
      await page.click('[data-testid^="view-strategy-"]').first();
      
      // Verify strategy details loaded
      await expect(page.locator('text=Strategy')).toBeVisible();
    } else {
      // Verify empty state
      await expect(page.locator('text=No strategies yet')).toBeVisible();
    }
  });

  test('toggle node library visibility', async ({ page }) => {
    await page.click('[data-testid="nav-strategies"]');
    await page.click('[data-testid="new-strategy-button"]');

    // Library should be visible by default
    await expect(page.locator('text=Node Library')).toBeVisible();

    // Toggle hide
    await page.click('[data-testid="toggle-library-button"]');
    await expect(page.locator('text=Node Library')).not.toBeVisible();

    // Toggle show
    await page.click('[data-testid="toggle-library-button"]');
    await expect(page.locator('text=Node Library')).toBeVisible();
  });

  test('clear canvas', async ({ page }) => {
    await page.click('[data-testid="nav-strategies"]');
    await page.click('[data-testid="new-strategy-button"]');

    // Add some nodes
    await page.click('[data-testid="add-node-indicator-0"]');
    await page.click('[data-testid="add-node-indicator-1"]');

    // Clear canvas
    await page.click('[data-testid="clear-canvas-button"]');

    // Verify nodes count is 0
    const panel = await page.locator('text=Nodes: 0').first();
    await expect(panel).toBeVisible();
  });
});