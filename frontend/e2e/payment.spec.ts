import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'

const tokenCache = new Map<string, { token: string; user: { id: number } }>()

async function apiLogin(request: APIRequestContext, email: string) {
  if (tokenCache.has(email)) return tokenCache.get(email)!
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password: 'password' },
  })
  if (!res.ok()) throw new Error(`login ${email} failed: ${res.status()}`)
  const data = await res.json()
  tokenCache.set(email, data)
  return data
}

async function seedAuth(page: Page, token: string, user: unknown) {
  await page.goto(BASE)
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('kohem-auth', JSON.stringify({ state: { user, token }, version: 0 }))
  }, { token, user })
}

test('flujo de pago end-to-end con FakeStripeAdapter', async ({ browser, request }) => {
  test.setTimeout(60_000)

  const client = await apiLogin(request, 'cliente@demo.co')
  const productsRes = await request.get(`${API}/catalog?per_page=1`, {
    headers: { Authorization: `Bearer ${client.token}` },
  })
  const productId = (await productsRes.json()).data[0].id

  const orderRes = await request.post(`${API}/orders`, {
    headers: { Authorization: `Bearer ${client.token}` },
    data: { items: [{ product_id: productId, quantity: 1 }] },
  })
  const order = await orderRes.json()

  const vendor = await apiLogin(request, 'vendedor@kohem.co')
  const confirmRes = await request.patch(`${API}/orders/${order.id}/status`, {
    headers: { Authorization: `Bearer ${vendor.token}` },
    data: { status: 'confirmed' },
  })
  expect(confirmRes.ok()).toBeTruthy()

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, client.token, client.user)

  await page.goto(`${BASE}/orders/${order.id}/checkout`)
  await expect(page.getByRole('heading', { name: /Pagar pedido/i })).toBeVisible({ timeout: 10000 })

  const payBtn = page.getByRole('button', { name: /Pagar con tarjeta/i })
  await expect(payBtn).toBeEnabled({ timeout: 5000 })
  await payBtn.click()

  // El FakeStripeAdapter redirige al endpoint backend, que a su vez nos manda a /payment/return?status=success
  await page.waitForURL(/\/payment\/return\?status=success/, { timeout: 15000 })
  await expect(page.getByRole('heading', { name: /Pago procesado/i })).toBeVisible({ timeout: 5000 })

  // La factura asociada debe quedar en estado 'paid'
  const invoicesRes = await request.get(`${API}/invoices`, {
    headers: { Authorization: `Bearer ${client.token}` },
  })
  const invoices = await invoicesRes.json()
  const paid = invoices.data.find((i: { order_id: number; status: string }) => i.order_id === order.id)
  expect(paid?.status).toBe('paid')

  await ctx.close()
})
