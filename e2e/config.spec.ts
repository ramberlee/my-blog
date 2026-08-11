import { test, expect } from '@playwright/test'

/** Helper: login via the UI */
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input[type="password"]')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin')
}

/** Helper: reset config to defaults via the admin API */
async function resetConfig(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const token = localStorage.getItem('blog-auth-token')
    if (!token) return
    const csrfRes = await fetch('/api/csrf-token', { headers: { Authorization: 'Bearer ' + token } })
    const { csrfToken } = await csrfRes.json()
    await fetch('/api/config/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, 'X-CSRF-Token': csrfToken },
    })
  })
}

test.describe('Site Config', () => {
  const unique = Date.now()
  const newSiteName = `TestSite_${unique}`

  test('change site name and verify it updates on the frontend', async ({ page }) => {
    // --- Login and navigate to config tab ---
    await login(page)
    await page.waitForSelector('button:has-text("\u7f51\u7ad9\u914d\u7f6e")')
    await page.click('button:has-text("\u7f51\u7ad9\u914d\u7f6e")')

    // --- Enter edit mode ---
    await page.waitForSelector('button:has-text("\u7f16\u8f91\u914d\u7f6e")')
    await page.click('button:has-text("\u7f16\u8f91\u914d\u7f6e")')

    // --- Wait for edit form ---
    await page.waitForSelector('label:has-text("\u7f51\u7ad9\u540d\u79f0")')

    // --- Modify site name ---
    const siteNameInput = page.locator('div:has(> label:has-text("\u7f51\u7ad9\u540d\u79f0")) > input[type="text"]')
    await siteNameInput.waitFor({ state: 'visible' })
    await siteNameInput.clear()
    await siteNameInput.fill(newSiteName)

    // --- Save config ---
    await page.locator('button:has-text("\u4fdd\u5b58\u914d\u7f6e")').click({ force: true })

    // --- Verify the config view shows the new site name ---
    await page.waitForSelector(`text=${newSiteName}`, { timeout: 10000 })
    await expect(page.locator(`text=${newSiteName}`).first()).toBeVisible()

    // --- Visit the home page and verify the title updated ---
    await page.goto('/')
    await page.waitForSelector(`text=${newSiteName}`, { timeout: 10000 })
    await expect(page.locator(`text=${newSiteName}`).first()).toBeVisible()

    // --- Reset config to default to avoid polluting other tests ---
    await resetConfig(page)
  })

  test('add hero image and verify it renders on the homepage', async ({ page }) => {
    const heroUrl = `https://example.com/e2e-hero-${unique}.jpg`
    const heroAlt = `E2E Hero ${unique}`

    // --- Login and navigate to config tab ---
    await login(page)
    await page.waitForSelector('button:has-text("\u7f51\u7ad9\u914d\u7f6e")')
    await page.click('button:has-text("\u7f51\u7ad9\u914d\u7f6e")')

    // --- Enter edit mode ---
    await page.waitForSelector('button:has-text("\u7f16\u8f91\u914d\u7f6e")')
    await page.click('button:has-text("\u7f16\u8f91\u914d\u7f6e")')

    // --- Add a new hero image ---
    await page.waitForSelector('button:has-text("\u6dfb\u52a0\u56fe\u7247")')
    const altInputs = page.locator('input[placeholder="\u56fe\u7247\u63cf\u8ff0"]')
    const imageCountBefore = await altInputs.count()
    await page.click('button:has-text("\u6dfb\u52a0\u56fe\u7247")')
    await expect(altInputs).toHaveCount(imageCountBefore + 1)

    // --- Fill URL and description of the new image ---
    await page.locator('input[placeholder="https://... \u6216 /uploads/xxx.jpg"]').last().fill(heroUrl)
    await altInputs.last().fill(heroAlt)

    // --- Save config ---
    await page.locator('button:has-text("\u4fdd\u5b58\u914d\u7f6e")').click({ force: true })
    await page.waitForSelector(`text=${heroAlt}`, { timeout: 10000 })
    await expect(page.locator(`text=${heroAlt}`).first()).toBeVisible()

    // --- Visit the home page and verify the hero image src/alt ---
    await page.goto('/')
    const heroGrid = page.locator('[data-testid="hero-photo-grid"]')
    await heroGrid.waitFor({ state: 'visible', timeout: 10000 })
    await heroGrid.scrollIntoViewIfNeeded()
    const heroImage = page.locator(`img[alt="${heroAlt}"]`)
    await expect(heroImage).toHaveAttribute('src', heroUrl, { timeout: 10000 })
    await expect(heroImage).toBeVisible()

    // --- Reset config to default to avoid polluting other tests ---
    await resetConfig(page)
  })
})
