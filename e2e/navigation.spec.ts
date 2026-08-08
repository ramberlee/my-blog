import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home \u2192 articles list \u2192 article detail \u2192 back', async ({ page }) => {
    // Go to home page
    await page.goto('/')
    await page.waitForSelector('nav')

    // Click articles link in navigation
    await page.click('nav a:has-text("\u6587\u7ae0")')
    await page.waitForURL('**/articles')
    await expect(page).toHaveURL(/\/articles/)
    await page.waitForSelector('main')

    // Click on the first article card
    const firstArticle = page.locator('main a[href^="/article/"]').first()
    await firstArticle.waitFor({ state: 'visible' })
    await firstArticle.click()

    // Should be on article detail page
    await page.waitForURL(/\/article\//)
    await expect(page.url()).toContain('/article/')

    // Click back to articles list
    await page.click('a:has-text("\u8fd4\u56de")')
    await page.waitForURL('**/articles')
    await expect(page).toHaveURL(/\/articles/)
  })

  test('home \u2192 about page', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('nav')

    // Click about link
    await page.click('nav a:has-text("\u5173\u4e8e")')
    await page.waitForURL('**/about')
    await expect(page).toHaveURL(/\/about/)

    // Verify the about page has content
    await page.waitForSelector('h1')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('404 page displays correctly for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')

    // Should show 404 content
    await page.waitForSelector('text=404')
    await expect(page.locator('text=404').first()).toBeVisible()

    // Should have a link back to home
    await page.waitForSelector('a:has-text("\u8fd4\u56de\u9996\u9875")')
    await expect(page.locator('a:has-text("\u8fd4\u56de\u9996\u9875")')).toBeVisible()

    // Click the link and verify it goes home
    await page.click('a:has-text("\u8fd4\u56de\u9996\u9875")')
    await page.waitForURL('/')
    await expect(page).toHaveURL('/')
  })
})