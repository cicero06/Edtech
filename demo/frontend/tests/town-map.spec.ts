import { expect, test } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../src/utils/sessionStorage.ts'
import type { SessionState } from '../src/types/session.ts'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()
})

test('Town Map shows approved resources and records observable location opens', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await expect(page.getByLabel('Başlangıç kaynakları')).toContainText('Su: %42')
  await expect(page.getByLabel('Başlangıç kaynakları')).toContainText('Bütçe: 50')
  await expect(page.getByText('Görev 2 / 7')).toBeVisible()
  await expect(page.getByText('0 / 5 Seçildi')).toBeVisible()

  const dam = page.getByRole('button', { name: /^Baraj: Su Rezervuarı/ })
  await dam.click()
  await dam.click()
  await page.getByRole('button', { name: /^Tarım: Tarımsal Alanlar/ }).click()
  await expect(page.getByText('2 / 5 Seçildi')).toBeVisible()

  const stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.exploredLocations).toEqual(['dam', 'agriculture'])
  expect(stored.state.events.filter(({ eventType }) => eventType === 'location_opened')).toHaveLength(3)
  expect(stored.state.events.at(-1)).toMatchObject({
    eventType: 'location_opened', screen: 'town-map', target: 'agriculture',
  })

  await page.reload()
  await expect(page.getByText('2 / 5 Seçildi')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Baraj: Su Rezervuarı, incelendi/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('Town Map can continue to Research and persist navigation', async ({ page }) => {
  await page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()

  const stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.currentScreen).toBe(3)
  expect(stored.state.events).toHaveLength(1)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeVisible()
})

test('Town Map remains usable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: /^Park: Kent Parkı/ }).click()
  await expect(page.getByText('1 / 5 Seçildi')).toBeVisible()
})
