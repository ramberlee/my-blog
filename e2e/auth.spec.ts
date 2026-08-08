import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('visiting /admin redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
    await page.waitForSelector('h1')
    await expect(page.locator('h1')).toContainText('ºóÌ¨µÇÂ¼')
  })

  test('wrong password shows error toast', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('input[type="password"]')

    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Wait for the error toast to appear
    await page.waitForSelector('text=ÃÜÂë´íÎó')
    await expect(page.locator('text=ÃÜÂë´íÎó')).toBeVisible()
  })

  test('correct password logs in and redirects to /admin', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('input[type="password"]')

    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for redirect to admin
    await page.waitForURL('**/admin')
    await expect(page).toHaveURL(/\/admin/)
    await page.waitForSelector('text=¹ÜÀí')
  })

  test('logout button returns to login page', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForSelector('input[type="password"]')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')

    // Click logout
    await page.waitForSelector('button:has-text("ÍË³ö")')
    await page.click('button:has-text("ÍË³ö")')

    // Should redirect to login
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })
})