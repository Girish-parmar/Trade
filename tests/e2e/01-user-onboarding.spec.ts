import { test, expect } from '@playwright/test';

test.describe('User Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete new user registration and onboarding', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.click('[data-testid="register-link"]');
    await expect(page).toHaveURL('/register');

    // Step 2: Fill registration form
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    await page.fill('[data-testid="register-name-input"]', 'Test User');
    await page.fill('[data-testid="register-email-input"]', testEmail);
    await page.fill('[data-testid="register-password-input"]', 'Test1234');

    // Step 3: Submit registration
    await page.click('[data-testid="register-submit-button"]');

    // Step 4: Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 5: Verify dashboard loaded
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
    
    // Step 6: Verify user sees welcome state
    await expect(page.locator('text=Welcome back, Test User')).toBeVisible();

    // Step 7: Verify metric cards are present
    await expect(page.locator('[data-testid="metric-card-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-1"]')).toBeVisible();
  });

  test('user can navigate after registration', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="login-email-input"]', 'admin@tradepro.com');
    await page.fill('[data-testid="login-password-input"]', 'admin123');
    await page.click('[data-testid="login-submit-button"]');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to different sections
    await page.click('[data-testid="nav-terminal"]');
    await expect(page).toHaveURL('/terminal');
    await expect(page.locator('[data-testid="trading-terminal-page"]')).toBeVisible();

    await page.click('[data-testid="nav-strategies"]');
    await expect(page).toHaveURL('/strategies');
    await expect(page.locator('[data-testid="strategies-page"]')).toBeVisible();

    await page.click('[data-testid="nav-orders"]');
    await expect(page).toHaveURL('/orders');
    await expect(page.locator('[data-testid="orders-page"]')).toBeVisible();
  });
});