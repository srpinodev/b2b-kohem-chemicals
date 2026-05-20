import { expect, test } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

async function loginAsCliente(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', 'cliente@demo.co')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(catalog|auth\/2fa)/, { timeout: 8000 })
}

test.describe('Pedidos y carrito', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('kohem-auth')
      localStorage.removeItem('kohem-cart')
    })
  })

  test('la página de pedidos carga correctamente', async ({ page }) => {
    await loginAsCliente(page)

    if (page.url().includes('/auth/2fa')) {
      test.skip()
      return
    }

    await page.goto(`${BASE_URL}/orders`)
    await expect(page.locator('h1')).toBeVisible({ timeout: 6000 })
  })

  test('la página del carrito está accesible', async ({ page }) => {
    await loginAsCliente(page)

    if (page.url().includes('/auth/2fa')) {
      test.skip()
      return
    }

    await page.goto(`${BASE_URL}/cart`)
    // Should show cart (empty or with items)
    await expect(page).toHaveURL(/\/cart/)
    await expect(page.locator('h1, [class*="carrito"], [class*="cart"]').first()).toBeVisible({ timeout: 6000 })
  })

  test('agregar producto al carrito actualiza el badge', async ({ page }) => {
    await loginAsCliente(page)

    if (page.url().includes('/auth/2fa')) {
      test.skip()
      return
    }

    // Go to catalog
    await page.goto(`${BASE_URL}/catalog`)

    // Find a product card and click it
    const firstProduct = page.locator('a[href*="/catalog/"]').first()
    const hasProduct = await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasProduct) {
      test.skip()
      return
    }

    await firstProduct.click()
    await page.waitForURL(/\/catalog\//, { timeout: 5000 })

    // Try to add to cart
    const addToCartBtn = page.locator('button:has-text("Agregar"), button:has-text("carrito")').first()
    if (await addToCartBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addToCartBtn.click()

      // Cart badge should appear or increment
      const badge = page.locator('nav a[href="/cart"] span, [aria-label="Carrito"] span').first()
      await expect(badge).toBeVisible({ timeout: 3000 })
    }
  })
})
