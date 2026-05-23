import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'

const tokenCache = new Map<string, { token: string; user: unknown }>()

async function apiLogin(request: APIRequestContext, email: string) {
  if (tokenCache.has(email)) return tokenCache.get(email)!
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password: 'password' },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`login ${email} failed: ${res.status()} ${body.slice(0, 200)}`)
  }
  const data = await res.json() as { token: string; user: unknown }
  tokenCache.set(email, data)
  return data
}

async function patchStatus(request: APIRequestContext, orderId: number, token: string, status: string) {
  const res = await request.patch(`${API}/orders/${orderId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`patch status ${status} failed: ${res.status()} ${body.slice(0, 300)}`)
  }
  return await res.json()
}

async function seedAuth(page: Page, token: string, user: unknown) {
  // Plantamos el estado del store Zustand persistido para saltarnos rate limit del login UI.
  await page.goto(BASE)
  await page.evaluate(({ token, user }) => {
    localStorage.setItem(
      'kohem-auth',
      JSON.stringify({ state: { user, token }, version: 0 }),
    )
  }, { token, user })
}

test('cliente ve cambio de estado del pedido sin recargar', async ({ browser, request }) => {
  test.setTimeout(60_000)

  const clientLogin = await apiLogin(request, 'cliente@demo.co')

  const productsRes = await request.get(`${API}/catalog?per_page=1`, {
    headers: { Authorization: `Bearer ${clientLogin.token}` },
  })
  const products = await productsRes.json()
  const productId = products.data[0].id

  const orderRes = await request.post(`${API}/orders`, {
    headers: { Authorization: `Bearer ${clientLogin.token}` },
    data: { items: [{ product_id: productId, quantity: 1 }] },
  })
  expect(orderRes.ok()).toBeTruthy()
  const order = await orderRes.json()

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, clientLogin.token, clientLogin.user)

  await page.goto(`${BASE}/orders/${order.id}`)
  await expect(page.locator('text=/Pendiente/').first()).toBeVisible({ timeout: 10000 })

  // Vendedor confirma vía API (simula otra pestaña)
  const vendor = await apiLogin(request, 'vendedor@kohem.co')
  await patchStatus(request, order.id, vendor.token, 'confirmed')

  // El cliente debe ver "Confirmado" sin recargar (poll = 5s).
  await expect(page.locator('text=/Confirmado/').first()).toBeVisible({ timeout: 20000 })

  await ctx.close()
})

test('listado de pedidos refresca cambios de estado', async ({ browser, request }) => {
  test.setTimeout(60_000)

  const clientLogin = await apiLogin(request, 'cliente@demo.co')

  const productsRes = await request.get(`${API}/catalog?per_page=1`, {
    headers: { Authorization: `Bearer ${clientLogin.token}` },
  })
  const products = await productsRes.json()
  const productId = products.data[0].id

  const orderRes = await request.post(`${API}/orders`, {
    headers: { Authorization: `Bearer ${clientLogin.token}` },
    data: { items: [{ product_id: productId, quantity: 1 }] },
  })
  const order = await orderRes.json()

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, clientLogin.token, clientLogin.user)

  await page.goto(`${BASE}/orders`)
  await expect(page.locator(`text=${order.order_number}`).first()).toBeVisible({ timeout: 10000 })

  const vendor = await apiLogin(request, 'vendedor@kohem.co')
  await patchStatus(request, order.id, vendor.token, 'confirmed')

  // Esperamos la transición en la fila del pedido sin recargar (poll = 10s).
  const card = page.locator('div').filter({ hasText: order.order_number }).filter({ hasText: 'Confirmado' }).first()
  await expect(card).toBeVisible({ timeout: 25000 })

  await ctx.close()
})
