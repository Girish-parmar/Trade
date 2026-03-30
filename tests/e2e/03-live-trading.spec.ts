import { test, expect } from '@playwright/test';

test.describe('Live Trading Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email-input"]', 'admin@tradepro.com');
    await page.fill('[data-testid="login-password-input"]', 'admin123');
    await page.click('[data-testid="login-submit-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('connect broker before trading', async ({ page }) => {
    // Navigate to settings
    await page.click('[data-testid="nav-settings"]');
    await expect(page).toHaveURL('/settings');

    // Add broker
    await page.click('[data-testid="add-broker-button"]');
    await page.selectOption('[data-testid="broker-select"]', 'zerodha');
    await page.fill('[data-testid="broker-api-key-input"]', 'test_api_key');
    await page.fill('[data-testid="broker-api-secret-input"]', 'test_api_secret');
    await page.click('[data-testid="connect-broker-button"]');

    // Verify broker connected
    await expect(page.locator('text=Broker connected successfully!')).toBeVisible({ timeout: 5000 });
  });

  test('place market order', async ({ page }) => {
    // First ensure broker is connected
    await page.goto('/settings');
    
    const brokerExists = await page.locator('[data-testid^="broker-item-"]').count() > 0;
    
    if (!brokerExists) {
      await page.click('[data-testid="add-broker-button"]');
      await page.selectOption('[data-testid="broker-select"]', 'zerodha');
      await page.fill('[data-testid="broker-api-key-input"]', 'test_key');
      await page.fill('[data-testid="broker-api-secret-input"]', 'test_secret');
      await page.click('[data-testid="connect-broker-button"]');
      await page.waitForTimeout(1000);
    }

    // Navigate to trading terminal
    await page.click('[data-testid="nav-terminal"]');
    await expect(page).toHaveURL('/terminal');

    // Select symbol
    await page.click('[data-testid="watchlist-AAPL"]');

    // Fill order form
    await page.fill('[data-testid="order-quantity-input"]', '10');
    await page.selectOption('[data-testid="order-type-select"]', 'market');

    // Place order
    await page.click('[data-testid="place-order-button"]');

    // Verify order placed
    await expect(page.locator('text=Order placed successfully!')).toBeVisible({ timeout: 5000 });
  });

  test('switch between buy and sell', async ({ page }) => {
    await page.click('[data-testid="nav-terminal"]');

    // Default should be buy
    const buyTab = page.locator('[data-testid="buy-tab"]');
    await expect(buyTab).toHaveAttribute('data-state', 'active');

    // Switch to sell
    await page.click('[data-testid="sell-tab"]');
    const sellTab = page.locator('[data-testid="sell-tab"]');
    await expect(sellTab).toHaveAttribute('data-state', 'active');

    // Switch back to buy
    await page.click('[data-testid="buy-tab"]');
    await expect(buyTab).toHaveAttribute('data-state', 'active');
  });

  test('view orders after placement', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]');
    await expect(page).toHaveURL('/orders');

    // Wait for orders page to load
    await expect(page.locator('[data-testid="orders-page"]')).toBeVisible();

    // Check if orders exist
    const hasOrders = await page.locator('[data-testid^="order-row-"]').count() > 0;
    
    if (hasOrders) {
      // Verify order table headers
      await expect(page.locator('text=Symbol')).toBeVisible();
      await expect(page.locator('text=Side')).toBeVisible();
      await expect(page.locator('text=Status')).toBeVisible();
    } else {
      await expect(page.locator('text=No orders yet')).toBeVisible();
    }
  });

  test('view positions', async ({ page }) => {
    await page.click('[data-testid="nav-positions"]');
    await expect(page).toHaveURL('/positions');
    await expect(page.locator('[data-testid="positions-page"]')).toBeVisible();
  });
});