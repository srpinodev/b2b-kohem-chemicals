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

test('vendedor NO ve el botón Pagar pedido del cliente', async ({ browser, request }) => {
  test.setTimeout(45_000)

  // 1) Cliente crea pedido
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

  // 2) Vendedor confirma
  const vendor = await apiLogin(request, 'vendedor@kohem.co')
  await request.patch(`${API}/orders/${order.id}/status`, {
    headers: { Authorization: `Bearer ${vendor.token}` },
    data: { status: 'confirmed' },
  })

  // 3) Cliente entra al pedido → SÍ ve Pagar
  const clientCtx = await browser.newContext()
  const clientPage = await clientCtx.newPage()
  await seedAuth(clientPage, client.token, client.user)
  await clientPage.goto(`${BASE}/orders/${order.id}`)
  await expect(clientPage.getByRole('link', { name: /Pagar pedido/i })).toBeVisible({ timeout: 10000 })
  await clientCtx.close()

  // 4) Vendedor entra al mismo pedido → NO ve Pagar
  const vendorCtx = await browser.newContext()
  const vendorPage = await vendorCtx.newPage()
  await seedAuth(vendorPage, vendor.token, vendor.user)
  await vendorPage.goto(`${BASE}/orders/${order.id}`)
  // Esperamos a que el detalle se renderice (totales visibles)
  await expect(vendorPage.getByText('Total', { exact: true }).first()).toBeVisible({ timeout: 10000 })
  await expect(vendorPage.getByRole('link', { name: /Pagar pedido/i })).toHaveCount(0)
  await vendorCtx.close()
})

test('vendedor que entra a /checkout es redirigido al detalle', async ({ browser, request }) => {
  test.setTimeout(45_000)

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
  await request.patch(`${API}/orders/${order.id}/status`, {
    headers: { Authorization: `Bearer ${vendor.token}` },
    data: { status: 'confirmed' },
  })

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, vendor.token, vendor.user)
  await page.goto(`${BASE}/orders/${order.id}/checkout`)
  await page.waitForURL(new RegExp(`/orders/${order.id}$`), { timeout: 10000 })
  await ctx.close()
})
