import { expect, test } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

// Helper: login as cliente (sin 2FA)
async function loginAsCliente(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', 'cliente@demo.co')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[type="submit"]')
  // Wait for redirect (catalog or 2fa)
  await page.waitForURL(/\/(catalog|auth\/2fa)/, { timeout: 8000 })
}

test.describe('Catálogo de productos', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('kohem-auth'))
  })

  test('catálogo muestra productos después de login', async ({ page }) => {
    await loginAsCliente(page)

    if (page.url().includes('/auth/2fa')) {
      test.skip()
      return
    }

    await expect(page).toHaveURL(/\/catalog/)
    // Should show at least some product cards or a catalog heading
    await expect(page.locator('h1, [class*="product"], [class*="catalog"]').first()).toBeVisible({ timeout: 8000 })
  })

  test('la barra de navegación muestra los enlaces correctos', async ({ page }) => {
    await loginAsCliente(page)

    if (page.url().includes('/auth/2fa')) {
      test.skip()
      return
    }

    await expect(page.getByText('Catálogo')).toBeVisible()
    await expect(page.getByText('Pedidos')).toBeVisible()
    await expect(page.getByText('Facturas')).toBeVisible()
  })

  test('el chatbot widget es visible en la página', async ({ page }) => {
    await loginAsCliente(page)

    if (page.url().includes('/auth/2fa')) {
      test.skip()
      return
    }

    // Chat button should be floating in bottom-right
    const chatBtn = page.locator('button[aria-label="Chat de soporte"]')
    await expect(chatBtn).toBeVisible({ timeout: 5000 })
  })

  test('el chatbot responde al escribir un mensaje', async ({ page }) => {
    await loginAsCliente(page)

    if (page.url().includes('/auth/2fa')) {
      test.skip()
      return
    }

    await page.click('button[aria-label="Chat de soporte"]')
    await page.fill('input[placeholder*="consulta"]', 'hola')
    await page.press('input[placeholder*="consulta"]', 'Enter')

    // Bot should reply with a message containing "bienvenido" or similar
    await expect(page.locator('text=/bienvenido|Kohem|ayudarte/i')).toBeVisible({ timeout: 8000 })
  })
})
