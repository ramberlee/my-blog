import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('visiting /admin redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
    await page.waitForSelector('h1')
    await expect(page.locator('h1')).toContainText('\u540e\u53f0\u767b\u5f55')
  })

  test('wrong password shows error toast', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('input[type="password"]')

    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Wait for the error toast to appear
    await page.waitForSelector('text=\u5bc6\u7801\u9519\u8bef')
    await expect(page.locator('text=\u5bc6\u7801\u9519\u8bef')).toBeVisible()
  })

  test('correct password logs in and redirects to /admin', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('input[type="password"]')

    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for redirect to admin
    await page.waitForURL('**/admin')
    await expect(page).toHaveURL(/\/admin/)
    await page.waitForSelector('text=\u7ba1\u7406')
  })

  test('logout button returns to login page', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForSelector('input[type="password"]')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')

    // Click logout
    await page.waitForSelector('button:has-text("\u9000\u51fa")')
    await page.click('button:has-text("\u9000\u51fa")')

    // Should redirect to login
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })
})