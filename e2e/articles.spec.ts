import { test, expect } from '@playwright/test'

/** Helper: login via the UI */
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input[type="password"]')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin')
}

test.describe('Article CRUD', () => {
  const unique = Date.now()
  const articleTitle = `E2E测试文章_${unique}`
  const editedTitle = `E2E编辑后_${unique}`

  test('login, create, verify, edit, search, and delete an article', async ({ page }) => {
    // --- Login ---
    await login(page)

    // --- Switch to content tab ---
    await page.waitForSelector('button:has-text("内容管理")')
    await page.click('button:has-text("内容管理")')

    // --- Create new article ---
    await page.waitForSelector('button:has-text("新建文章")')
    await page.click('button:has-text("新建文章")')

    // Fill in the form
    await page.waitForSelector('input[placeholder*="文章标题"]')
    await page.fill('input[placeholder*="文章标题"]', articleTitle)
    await page.fill('input[placeholder*="选择或输入分类"]', '技术')
    await page.fill('input[placeholder*="React, TypeScript"]', 'E2E, Playwright, 自动化')

    // Fill content textarea
    await page.fill('textarea', `这是E2E测试生成的文章内容。唯一标识: ${unique}`)

    // Click save
    await page.click('button:has-text("保存")')

    // Wait for success toast
    await page.waitForSelector('text=文章已创建')
    await expect(page.locator('text=文章已创建')).toBeVisible()

    // --- Verify article appears in list ---
    await page.waitForSelector(`h4:has-text("${articleTitle}")`)
    await expect(page.locator(`h4:has-text("${articleTitle}")`)).toBeVisible()

    // --- Edit article title ---
    // Click the edit button on the article row
    const articleRow = page.locator(`h4:has-text("${articleTitle}")`).locator('..')
    await articleRow.locator('button:has-text("编辑")').click()

    // Wait for edit form
    await page.waitForSelector('input[placeholder*="文章标题"]')
    await page.fill('input[placeholder*="文章标题"]', editedTitle)
    await page.click('button:has-text("保存")')

    // Wait for update toast
    await page.waitForSelector('text=文章已更新')
    await expect(page.locator('text=文章已更新')).toBeVisible()

    // --- Verify edited title ---
    await page.waitForSelector(`h4:has-text("${editedTitle}")`)
    await expect(page.locator(`h4:has-text("${editedTitle}")`)).toBeVisible()

    // --- Search for article ---
    await page.fill('input[placeholder*="搜索标题"]', editedTitle)
    // Wait a moment for the filter to apply
    await page.waitForTimeout(500)
    await expect(page.locator(`h4:has-text("${editedTitle}")`)).toBeVisible()

    // Clear search
    await page.fill('input[placeholder*="搜索标题"]', '')
    await page.waitForTimeout(500)

    // --- Delete article ---
    const editedRow = page.locator(`h4:has-text("${editedTitle}")`).locator('..')
    // Accept the confirm dialog
    page.on('dialog', dialog => dialog.accept())
    await editedRow.locator('button:has-text("删除")').click()

    // Wait for delete toast
    await page.waitForSelector('text=文章已删除')
    await expect(page.locator('text=文章已删除')).toBeVisible()

    // Verify article is gone
    await expect(page.locator(`h4:has-text("${editedTitle}")`)).toHaveCount(0)
  })
})