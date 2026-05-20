import { expect, test } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored auth state
    await page.goto(BASE_URL)
    await page.evaluate(() => localStorage.removeItem('kohem-auth'))
  })

  test('redirige a /login cuando no hay sesión', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`)
    await expect(page).toHaveURL(/\/login/)
  })

  test('login con credenciales correctas redirige al catálogo', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    await page.fill('input[type="email"]', 'cliente@demo.co')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')

    // Should either redirect to /catalog or /auth/2fa
    await expect(page).toHaveURL(/\/(catalog|auth\/2fa)/, { timeout: 8000 })
  })

  test('login con credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    await page.fill('input[type="email"]', 'noexiste@kohem.co')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('.bg-red-50, [class*="red"]')).toBeVisible({ timeout: 5000 })
  })
})
