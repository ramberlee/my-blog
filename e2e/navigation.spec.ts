import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home → articles list → article detail → back', async ({ page }) => {
    // Go to home page
    await page.goto('/')
    await page.waitForSelector('nav')

    // Click "文章" link in navigation
    await page.click('nav a:has-text("文章")')
    await page.waitForURL('**/articles')
    await expect(page).toHaveURL(/\/articles/)
    await page.waitForSelector('main')

    // Click on the first article card
    const firstArticle = page.locator('main a[href^="/article/"]').first()
    await firstArticle.waitForSelector()
    await firstArticle.click()

    // Should be on article detail page
    await page.waitForURL(/\/article\//)
    await expect(page.url()).toContain('/article/')

    // Click back to articles list
    await page.click('a:has-text("返回")')
    await page.waitForURL('**/articles')
    await expect(page).toHaveURL(/\/articles/)
  })

  test('home → about page', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('nav')

    // Click "关于" link
    await page.click('nav a:has-text("关于")')
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
    await page.waitForSelector('a:has-text("返回首页")')
    await expect(page.locator('a:has-text("返回首页")')).toBeVisible()

    // Click the link and verify it goes home
    await page.click('a:has-text("返回首页")')
    await page.waitForURL('/')
    await expect(page).toHaveURL('/')
  })
})