import { test, expect } from '@playwright/test'

/** Helper: login via the UI */
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input[type="password"]')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin')
}

/** Helper: click the save button directly via JS to avoid DOM detachment */
async function clickSaveButton(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.textContent?.trim() === '\u4fdd\u5b58') {
        ;(btn as HTMLButtonElement).click()
        break
      }
    }
  })
}

/** Helper: find article row by title and click an action button */
async function clickArticleAction(page: import('@playwright/test').Page, title: string, action: string) {
  const row = page.locator(`div:has(h4:has-text("${title}")):has(button:has-text("${action}"))`)
  await row.locator(`button:has-text("${action}")`).first().click()
}

test.describe('Article CRUD', () => {
  const unique = Date.now()
  const articleTitle = `E2E_${unique}`
  const editedTitle = `E2E_EDITED_${unique}`

  test('login, create, verify, edit, search, and delete an article', async ({ page }) => {
    // --- Login ---
    await login(page)

    // --- Switch to content tab ---
    await page.waitForSelector('button:has-text("\u5185\u5bb9\u7ba1\u7406")')
    await page.click('button:has-text("\u5185\u5bb9\u7ba1\u7406")')

    // --- Create new article ---
    await page.waitForSelector('button:has-text("\u65b0\u5efa\u6587\u7ae0")', { timeout: 10000 })
    await page.click('button:has-text("\u65b0\u5efa\u6587\u7ae0")')

    // Wait for the rich editor to appear
    await page.waitForSelector('.tiptap-editor-content', { timeout: 10000 })

    // Fill in the form fields
    await page.fill('input[placeholder*="\u6587\u7ae0\u6807\u9898"]', articleTitle)
    await page.fill('input[placeholder*="\u9009\u62e9\u6216\u8f93\u5165\u5206\u7c7b"]', '\u6280\u672f')
    await page.fill('input[placeholder*="React, TypeScript"]', 'E2E, Playwright')

    // Fill content via the TipTap editor
    const editor = page.locator('.tiptap-editor-content')
    await editor.click()
    await page.keyboard.type(`E2E test content for article ${unique} with enough chars`)

    // Click save via JS to avoid DOM detachment
    await clickSaveButton(page)

    // --- Verify article appears in list ---
    await page.waitForSelector(`h4:has-text("${articleTitle}")`, { timeout: 15000 })
    await expect(page.locator(`h4:has-text("${articleTitle}")`)).toBeVisible()

    // --- Edit article title ---
    await clickArticleAction(page, articleTitle, '\u7f16\u8f91')

    // Wait for edit form with editor
    await page.waitForSelector('.tiptap-editor-content', { timeout: 10000 })
    await page.fill('input[placeholder*="\u6587\u7ae0\u6807\u9898"]', editedTitle)
    await clickSaveButton(page)

    // --- Verify edited title appears ---
    await page.waitForSelector(`h4:has-text("${editedTitle}")`, { timeout: 15000 })
    await expect(page.locator(`h4:has-text("${editedTitle}")`)).toBeVisible()

    // --- Search for article ---
    await page.fill('input[placeholder*="\u641c\u7d22\u6807\u9898"]', editedTitle)
    await page.waitForTimeout(500)
    await expect(page.locator(`h4:has-text("${editedTitle}")`)).toBeVisible()

    // Clear search
    await page.fill('input[placeholder*="\u641c\u7d22\u6807\u9898"]', '')
    await page.waitForTimeout(500)

    // --- Delete article ---
    page.on('dialog', dialog => dialog.accept())
    await clickArticleAction(page, editedTitle, '\u5220\u9664')

    // Verify article is removed from list
    await page.waitForTimeout(1000)
    await expect(page.locator(`h4:has-text("${editedTitle}")`)).toHaveCount(0)
  })
})