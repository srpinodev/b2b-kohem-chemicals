import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

async function login(page: import('@playwright/test').Page, email = 'cliente@demo.co') {
  await page.goto(`${BASE}/login`)
  await page.getByPlaceholder('tu@empresa.co').fill(email)
  await page.getByPlaceholder('••••••••').fill('password')
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL(/\/catalog/, { timeout: 10000 })
}

test('login page renders with brand palette', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await expect(page).toHaveTitle(/Kohem/)
  await expect(page.getByRole('heading', { name: /Inicia sesión/i })).toBeVisible()
  await page.screenshot({ path: 'e2e/__screenshots__/login.png', fullPage: true })
})

test('catalog page renders products', async ({ page }) => {
  await login(page)
  await expect(page.getByRole('heading', { name: /Productos químicos/i })).toBeVisible()
  await page.waitForSelector('article', { timeout: 10000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'e2e/__screenshots__/catalog.png', fullPage: true })
})

test('product detail renders', async ({ page }) => {
  await login(page)
  await page.waitForSelector('article', { timeout: 10000 })
  await page.locator('article').first().click()
  await page.waitForURL(/\/catalog\/[^/]+$/, { timeout: 10000 })
  await expect(page.getByRole('button', { name: /Agregar al carrito|Producto agotado/i })).toBeVisible()
  await page.screenshot({ path: 'e2e/__screenshots__/product-detail.png', fullPage: true })
})

test('cart and order flow', async ({ page }) => {
  await login(page)
  await page.waitForSelector('article', { timeout: 10000 })
  await page.locator('article').first().click()
  const addBtn = page.getByRole('button', { name: /Agregar al carrito/i })
  if (await addBtn.isVisible()) {
    await addBtn.click()
    await page.getByRole('link', { name: /Carrito|Ver carrito/i }).first().click().catch(() => {})
  }
  await page.goto(`${BASE}/cart`)
  await page.screenshot({ path: 'e2e/__screenshots__/cart.png', fullPage: true })
})

test('orders list', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/orders`)
  await expect(page.getByRole('heading', { name: /Mis pedidos/i })).toBeVisible()
  await page.screenshot({ path: 'e2e/__screenshots__/orders.png', fullPage: true })
})

test('invoices list', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/invoices`)
  await expect(page.getByRole('heading', { name: /Mis facturas/i })).toBeVisible()
  await page.screenshot({ path: 'e2e/__screenshots__/invoices.png', fullPage: true })
})

test('admin dashboard', async ({ page }) => {
  await login(page, 'admin@kohem.co')
  await page.goto(`${BASE}/admin`)
  await expect(page.getByRole('heading', { name: /Bienvenido/i })).toBeVisible()
  await page.screenshot({ path: 'e2e/__screenshots__/dashboard-admin.png', fullPage: true })
})
