import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const MAILPIT = 'http://localhost:8025/api/v1'

const tokenCache = new Map<string, { token: string; user: { id: number; email: string; two_factor_enabled: boolean } }>()

async function apiLogin(request: APIRequestContext, email: string, password = 'password') {
  const key = `${email}::${password}`
  if (tokenCache.has(key)) return tokenCache.get(key)!
  const res = await request.post(`${API}/auth/login`, { data: { email, password } })
  if (!res.ok()) throw new Error(`login ${email} failed: ${res.status()}`)
  const data = await res.json()
  tokenCache.set(key, data)
  return data
}

async function seedAuth(page: Page, token: string, user: unknown) {
  await page.goto(BASE)
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('kohem-auth', JSON.stringify({ state: { user, token }, version: 0 }))
  }, { token, user })
}

async function clearMailpit(request: APIRequestContext) {
  await request.delete(`${MAILPIT}/messages`)
}

async function waitForEmail(
  request: APIRequestContext,
  matcher: { to: string; subjectIncludes: string },
  timeoutMs = 15000,
) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const list = await request.get(`${MAILPIT}/messages?limit=50`)
    if (list.ok()) {
      const body = await list.json()
      const items: Array<{ ID: string; Subject: string; To: Array<{ Address: string }> }> = body.messages ?? []
      const hit = items.find((m) =>
        m.Subject.toLowerCase().includes(matcher.subjectIncludes.toLowerCase()) &&
        m.To.some((t) => t.Address.toLowerCase() === matcher.to.toLowerCase()),
      )
      if (hit) {
        const detail = await request.get(`${MAILPIT}/message/${hit.ID}`)
        return await detail.json()
      }
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`email "${matcher.subjectIncludes}" not received within ${timeoutMs}ms`)
}

function extractOtp(text: string): string {
  // Buscamos después del marcador "verificación es:" para evitar capturar 6 dígitos
  // del order_number (ej. ORD-XXX-260523).
  const after = text.split(/verificaci[oó]n es:?/i)[1] ?? text
  const stripped = after.replace(/<[^>]+>/g, ' ')
  const match = stripped.match(/\b(\d{6})\b/)
  if (!match) throw new Error(`no 6-digit code found after marker: ${stripped.slice(0, 200)}`)
  return match[1]
}

test('pago requiere OTP por correo y completa el flujo', async ({ browser, request }) => {
  test.setTimeout(90_000)

  const client = await apiLogin(request, 'cliente@demo.co')
  const products = await request.get(`${API}/catalog?per_page=1`, {
    headers: { Authorization: `Bearer ${client.token}` },
  })
  const productId = (await products.json()).data[0].id

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

  await clearMailpit(request)

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, client.token, client.user)

  await page.goto(`${BASE}/orders/${order.id}/checkout`)
  await page.getByTestId('request-code-btn').click()

  // Esperamos el correo con el OTP
  const mail = await waitForEmail(request, {
    to: 'cliente@demo.co',
    subjectIncludes: 'Código de verificación',
  })
  // Preferimos el Text (sin HTML, marcador limpio) sobre el HTML renderizado.
  const otp = extractOtp(mail.Text || mail.HTML || '')

  // Capturamos el response de /checkout para confirmar 201 antes del redirect
  const checkoutWait = page.waitForResponse(
    (r) => r.url().includes(`/orders/${order.id}/checkout`) && r.request().method() === 'POST',
  )
  await page.getByTestId('otp-input').fill(otp)
  await page.getByTestId('verify-pay-btn').click()
  const resp = await checkoutWait
  expect(resp.status()).toBe(201)

  await page.waitForURL(/\/payment\/return\?status=success/, { timeout: 15000 })
  await ctx.close()
})

test('checkout con código inválido falla con 422', async ({ browser, request }) => {
  test.setTimeout(45_000)

  const client = await apiLogin(request, 'cliente@demo.co')
  const products = await request.get(`${API}/catalog?per_page=1`, {
    headers: { Authorization: `Bearer ${client.token}` },
  })
  const productId = (await products.json()).data[0].id
  const order = await (await request.post(`${API}/orders`, {
    headers: { Authorization: `Bearer ${client.token}` },
    data: { items: [{ product_id: productId, quantity: 1 }] },
  })).json()

  const vendor = await apiLogin(request, 'vendedor@kohem.co')
  await request.patch(`${API}/orders/${order.id}/status`, {
    headers: { Authorization: `Bearer ${vendor.token}` },
    data: { status: 'confirmed' },
  })

  // Pedimos un código (lo descartamos)
  await request.post(`${API}/orders/${order.id}/payment-code`, {
    headers: { Authorization: `Bearer ${client.token}` },
  })

  const r = await request.post(`${API}/orders/${order.id}/checkout`, {
    headers: { Authorization: `Bearer ${client.token}` },
    data: {
      success_url: 'http://localhost:5173/payment/return?status=success',
      cancel_url: 'http://localhost:5173/payment/return?status=cancelled',
      verification_code: '000000',
    },
  })
  expect(r.status()).toBe(422)
})

test('cuenta demo NO es forzada a /auth/2fa-setup', async ({ browser, request }) => {
  const client = await apiLogin(request, 'cliente@demo.co')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, client.token, client.user)

  await page.goto(`${BASE}/catalog`)
  // Debe aterrizar en catálogo, NO en setup
  await expect(page).toHaveURL(/\/catalog$/, { timeout: 10000 })
  await ctx.close()
})

test('usuario no-demo recién creado es redirigido a /auth/2fa-setup', async ({ browser, request }) => {
  test.setTimeout(45_000)

  const admin = await apiLogin(request, 'admin@kohem.co')
  const email = `prod-${Date.now()}@e2e.real`
  const pw = 'StrongP4ss!'

  await request.post(`${API}/admin/users`, {
    headers: { Authorization: `Bearer ${admin.token}` },
    data: { name: 'Prod User', email, password: pw, role: 'cliente' },
  })

  const fresh = await apiLogin(request, email, pw)

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, fresh.token, fresh.user)

  await page.goto(`${BASE}/catalog`)
  // ProtectedRoute → /auth/2fa-setup porque !two_factor_enabled y no es demo
  await expect(page).toHaveURL(/\/auth\/2fa-setup$/, { timeout: 10000 })
  await expect(page.getByRole('heading', { name: /Activa la autenticación en dos pasos/i })).toBeVisible()
  await ctx.close()
})

