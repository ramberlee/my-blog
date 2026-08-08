import { test, expect } from '@playwright/test'

/** Helper: login via the UI */
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input[type="password"]')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin')
}

test.describe('Site Config', () => {
  const unique = Date.now()
  const newSiteName = `²âÊÔÕ¾µã_${unique}`

  test('change site name and verify it updates on the frontend', async ({ page }) => {
    // --- Login and navigate to config tab ---
    await login(page)
    await page.waitForSelector('button:has-text("ÍøÕ¾ÅäÖÃ")')
    await page.click('button:has-text("ÍøÕ¾ÅäÖÃ")')

    // --- Enter edit mode ---
    await page.waitForSelector('button:has-text("±à¼­ÅäÖÃ")')
    await page.click('button:has-text("±à¼­ÅäÖÃ")')

    // --- Modify site name ---
    await page.waitForSelector('input[type="text"]')
    // The first text input in the config form is "ÍøÕ¾Ãû³Æ"
    const siteNameInput = page.locator('label:has-text("ÍøÕ¾Ãû³Æ")').locator('..').locator('input')
    await siteNameInput.clear()
    await siteNameInput.fill(newSiteName)

    // --- Save config ---
    await page.click('button:has-text("±£´æÅäÖÃ")')

    // Wait for success toast
    await page.waitForSelector('text=ÅäÖÃÒÑ±£´æ')
    await expect(page.locator('text=ÅäÖÃÒÑ±£´æ')).toBeVisible()

    // --- Verify the site name is updated in the config view ---
    await page.waitForSelector(`text=${newSiteName}`)
    await expect(page.locator(`text=${newSiteName}`).first()).toBeVisible()

    // --- Visit the home page and verify the title updated ---
    await page.goto('/')
    await page.waitForSelector(`text=${newSiteName}`)
    await expect(page.locator(`text=${newSiteName}`).first()).toBeVisible()

    // --- Reset config to default to avoid polluting other tests ---
    await login(page)
    await page.waitForSelector('button:has-text("ÍøÕ¾ÅäÖÃ")')
    await page.click('button:has-text("ÍøÕ¾ÅäÖÃ")')
    // Use API to reset instead of UI to keep it simple
    await page.evaluate(async () => {
      const token = localStorage.getItem('blog-auth-token')
      if (!token) return
      // Fetch CSRF token first
      const csrfRes = await fetch('/api/csrf-token', { headers: { Authorization: 'Bearer ' + token } })
      const { csrfToken } = await csrfRes.json()
      await fetch('/api/config/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, 'X-CSRF-Token': csrfToken },
      })
    })
  })
})