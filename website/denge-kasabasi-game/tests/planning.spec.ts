import { expect, test } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../src/utils/sessionStorage.ts'
import type { SessionState } from '../src/types/session.ts'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' }).click()
  await page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()
})

test('Planning reviews interventions and enforces the approved plan constraints', async ({ page }) => {
  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Kalan bütçe: 50')
  await page.getByRole('button', { name: 'Şebeke kaçaklarını onar etkilerini incele' }).click()
  await page.getByRole('button', { name: 'Şebeke kaçaklarını onar seç' }).click()
  await page.getByRole('button', { name: 'Yağmur suyu toplama sistemi kur seç' }).click()

  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Kullanılan bütçe: 45')
  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Kalan bütçe: 5')
  await expect(page.getByRole('button', { name: 'Yeni kuyu aç seç' })).toBeDisabled()

  await page.getByRole('button', { name: 'Park sulamasını azalt seç' }).click()
  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Seçilen çözüm: 3 / 3')
  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Kullanılan bütçe: 47')
  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Kalan bütçe: 3')

  await page.getByRole('button', { name: 'Yağmur suyu toplama sistemi kur seçimini kaldır' }).click()
  await page.getByRole('button', { name: 'Yeni kuyu aç seç' }).click()
  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Kullanılan bütçe: 37')

  const stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.selectedInterventions).toEqual([
    'network-leak-repair', 'reduce-park-irrigation', 'new-well',
  ])
  expect(stored.state.events.filter(({ eventType }) => eventType === 'intervention_viewed')).toHaveLength(1)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'intervention_selected')).toHaveLength(4)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'intervention_removed')).toHaveLength(1)

  await page.reload()
  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Kalan bütçe: 13')
})

test('Planning allows an empty plan because no minimum is approved', async ({ page }) => {
  await page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()

  const stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.currentScreen).toBe(5)
  expect(stored.state.selectedInterventions).toEqual([])

  await page.reload()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeVisible()
})

test('Planning remains usable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Tarımsal sulamayı azalt seç' }).click()
  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Kalan bütçe: 45')
})
