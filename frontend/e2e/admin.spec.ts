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

test('admin crea, edita y elimina un producto', async ({ browser, request }) => {
  test.setTimeout(60_000)

  const admin = await apiLogin(request, 'admin@kohem.co')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, admin.token, admin.user)

  const uniqSku = `TEST-E2E-${Date.now().toString(36).toUpperCase()}`

  // Crear
  await page.goto(`${BASE}/admin/products/new`)
  await expect(page.getByRole('heading', { name: /Nuevo producto/i })).toBeVisible()

  await page.getByLabel(/SKU/i).fill(uniqSku)
  await page.getByLabel(/Nombre/i).first().fill('Producto E2E Test')
  await page.getByLabel(/Unidad/i).fill('L')
  await page.getByLabel(/Precio/i).fill('1234.56')
  await page.getByLabel(/Stock/i).fill('99')

  await page.getByRole('button', { name: /Crear producto/i }).click()
  await page.waitForURL(/\/admin\/products$/, { timeout: 10000 })

  // El producto debe existir en el catálogo (verificado vía API para evitar races con polling)
  const created = await request.get(`${API}/admin/products?search=${uniqSku}`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  })
  const createdBody = await created.json()
  expect(createdBody.total).toBe(1)

  // Editar — navegamos directo a la URL de edición
  await page.goto(`${BASE}/admin/products/${uniqSku}/edit`)
  await expect(page.getByRole('heading', { name: /Editar producto/i })).toBeVisible({ timeout: 10000 })
  const nameInput = page.getByLabel(/Nombre/i).first()
  await nameInput.fill('Producto E2E Editado')
  await page.getByRole('button', { name: /Guardar cambios/i }).click()
  await page.waitForURL(/\/admin\/products$/, { timeout: 10000 })

  const edited = await request.get(`${API}/admin/products?search=${uniqSku}`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  })
  const editedBody = await edited.json()
  expect(editedBody.data[0].name).toBe('Producto E2E Editado')

  // Eliminar — desde la lista (que ahora tras el edit muestra todos los productos),
  // ubicamos la fila por SKU y disparamos Eliminar dentro de esa fila.
  const row = page.locator('tr').filter({ hasText: uniqSku })
  await expect(row).toBeVisible({ timeout: 10000 })
  await row.getByRole('button', { name: /^Eliminar$/ }).click()
  const [delResp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/admin/products/') && r.request().method() === 'DELETE'),
    row.getByRole('button', { name: /^Confirmar$/ }).click(),
  ])
  expect(delResp.status()).toBe(200)

  // Verificación canónica vía API — evita races con polling/filtros en la UI.
  const verify = await request.get(`${API}/admin/products?search=${uniqSku}`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  })
  const body = await verify.json()
  expect(body.total).toBe(0)

  await ctx.close()
})

test('admin crea usuario y resetea contraseña', async ({ browser, request }) => {
  test.setTimeout(60_000)

  const admin = await apiLogin(request, 'admin@kohem.co')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, admin.token, admin.user)

  await page.goto(`${BASE}/admin/users`)
  await expect(page.getByRole('heading', { name: /^Usuarios$/i })).toBeVisible()

  const uniqEmail = `test-${Date.now()}@e2e.co`

  await page.getByRole('button', { name: /Nuevo usuario/i }).click()
  await expect(page.getByRole('heading', { name: /Nuevo usuario/i })).toBeVisible()

  await page.getByLabel(/Nombre/i).fill('Test E2E User')
  await page.getByLabel(/Correo/i).fill(uniqEmail)
  await page.getByLabel(/Contraseña/i).fill('TempPassword123')
  // Por defecto el rol queda en "cliente"

  await page.getByRole('button', { name: /^Crear$/i }).click()
  await expect(page.getByRole('heading', { name: /Nuevo usuario/i })).toHaveCount(0, { timeout: 10000 })

  // El usuario debe estar listado
  await page.getByPlaceholder(/Buscar por nombre/i).fill(uniqEmail)
  await expect(page.locator(`text=${uniqEmail}`).first()).toBeVisible({ timeout: 10000 })

  // Reset password — debe abrir modal con contraseña temporal
  await page.getByRole('button', { name: /Reset password/i }).first().click()
  await expect(page.getByRole('heading', { name: /Contraseña restablecida/i })).toBeVisible({ timeout: 10000 })

  const tempPwInput = page.locator('input[readonly]').first()
  const tempPw = await tempPwInput.inputValue()
  expect(tempPw.length).toBeGreaterThanOrEqual(8)

  // Confirmar que el usuario puede loguearse con la nueva contraseña
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { email: uniqEmail, password: tempPw },
  })
  expect(loginRes.ok()).toBeTruthy()

  await ctx.close()
})

test('cliente no puede acceder a /admin/users', async ({ browser, request }) => {
  const client = await apiLogin(request, 'cliente@demo.co')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await seedAuth(page, client.token, client.user)

  await page.goto(`${BASE}/admin/users`)
  // ProtectedRoute con rol no autorizado → redirige a /dashboard
  await page.waitForURL(/\/dashboard$/, { timeout: 10000 })

  await ctx.close()
})
