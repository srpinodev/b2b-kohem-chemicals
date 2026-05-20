import { test, expect } from '@playwright/test'

test('health check page loads and shows app status', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Kohem Chemicals')).toBeVisible()
  await expect(page.getByText('Sprint 0')).toBeVisible()
})
