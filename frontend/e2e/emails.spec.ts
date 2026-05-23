import { test, expect, type APIRequestContext } from '@playwright/test'

const API = 'http://localhost:8000/api'
const MAILPIT = 'http://localhost:8025/api/v1'

const tokenCache = new Map<string, { token: string; user: { id: number } }>()

async function apiLogin(request: APIRequestContext, email: string, password = 'password') {
  const key = `${email}::${password}`
  if (tokenCache.has(key)) return tokenCache.get(key)!
  const res = await request.post(`${API}/auth/login`, { data: { email, password } })
  if (!res.ok()) throw new Error(`login ${email} failed: ${res.status()}`)
  const data = await res.json()
  tokenCache.set(key, data)
  return data
}

async function clearMailpit(request: APIRequestContext) {
  await request.delete(`${MAILPIT}/messages`)
}

/** Espera hasta que aparezca un correo cuyo subject incluya el texto dado. */
async function waitForEmail(
  request: APIRequestContext,
  matcher: { to?: string; subjectIncludes: string },
  timeoutMs = 15000,
): Promise<{ subject: string; to: string; html: string; text: string }> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const list = await request.get(`${MAILPIT}/messages?limit=50`)
    if (list.ok()) {
      const body = await list.json()
      const items: Array<{ ID: string; Subject: string; To: Array<{ Address: string }> }> =
        body.messages ?? []
      const hit = items.find((m) => {
        if (!m.Subject.toLowerCase().includes(matcher.subjectIncludes.toLowerCase())) return false
        if (matcher.to && !m.To.some((t) => t.Address.toLowerCase() === matcher.to!.toLowerCase())) return false
        return true
      })
      if (hit) {
        const detail = await request.get(`${MAILPIT}/message/${hit.ID}`)
        const d = await detail.json()
        return {
          subject: d.Subject,
          to: d.To?.[0]?.Address ?? '',
          html: d.HTML ?? '',
          text: d.Text ?? '',
        }
      }
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`email "${matcher.subjectIncludes}" not received within ${timeoutMs}ms`)
}

test.beforeEach(async ({ request }) => {
  await clearMailpit(request)
})

test('crear usuario envía email de bienvenida con la contraseña inicial', async ({ request }) => {
  test.setTimeout(45_000)

  const admin = await apiLogin(request, 'admin@kohem.co')
  const email = `welcome-${Date.now()}@e2e.local`
  const initialPw = 'PaSsW0rd-Initial'

  const createRes = await request.post(`${API}/admin/users`, {
    headers: { Authorization: `Bearer ${admin.token}` },
    data: {
      name: 'Welcome E2E',
      email,
      password: initialPw,
      role: 'cliente',
    },
  })
  expect(createRes.ok()).toBeTruthy()

  const mail = await waitForEmail(request, { to: email, subjectIncludes: 'Bienvenido' })
  expect(mail.to).toBe(email)
  expect(mail.html).toContain(initialPw)
})

test('reset password envía email con la contraseña temporal', async ({ request }) => {
  test.setTimeout(45_000)

  const admin = await apiLogin(request, 'admin@kohem.co')
  const email = `reset-${Date.now()}@e2e.local`

  await request.post(`${API}/admin/users`, {
    headers: { Authorization: `Bearer ${admin.token}` },
    data: { name: 'Reset E2E', email, password: 'InitialPwd123', role: 'cliente' },
  })

  // Esperamos que llegue el de bienvenida y limpiamos para no interferir.
  await waitForEmail(request, { to: email, subjectIncludes: 'Bienvenido' })
  await clearMailpit(request)

  const list = await request.get(`${API}/admin/users?search=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  })
  const userId = (await list.json()).data[0].id

  const resetRes = await request.post(`${API}/admin/users/${userId}/reset-password`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  })
  expect(resetRes.ok()).toBeTruthy()
  const tempPw = (await resetRes.json()).temporary_password as string

  const mail = await waitForEmail(request, { to: email, subjectIncludes: 'restablecida' })
  expect(mail.html).toContain(tempPw)
})

test('cambio de estado del pedido (shipped) envía email al cliente', async ({ request }) => {
  test.setTimeout(60_000)

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
  // Encadenamos hasta shipped — el primer salto a confirmed manda el correo
  // "Pedido X confirmado" (SendOrderConfirmationEmailListener); el resto los manda
  // OrderStatusNotification por mail.
  for (const status of ['confirmed', 'processing', 'shipped']) {
    const r = await request.patch(`${API}/orders/${order.id}/status`, {
      headers: { Authorization: `Bearer ${vendor.token}` },
      data: { status },
    })
    expect(r.ok()).toBeTruthy()
  }

  // Buscamos el correo del salto a shipped.
  const mail = await waitForEmail(request, {
    to: 'cliente@demo.co',
    subjectIncludes: 'enviado',
  })
  expect(mail.subject.toLowerCase()).toContain(order.order_number.toLowerCase())
})
