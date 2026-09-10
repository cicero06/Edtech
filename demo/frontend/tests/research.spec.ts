import { expect, test } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../src/utils/sessionStorage.ts'
import type { SessionState } from '../src/types/session.ts'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()
})

test('Research opens sources, presents approved evidence and persists observable events', async ({ page }) => {
  await expect(page.getByText('0 / 6 İncelendi')).toBeVisible()
  const engineer = page.getByRole('button', { name: /^Belediye mühendisi/ }).first()
  await engineer.click()
  await expect(page.getByRole('heading', { name: 'Belediye mühendisi' })).toBeVisible()
  await expect(page.getByText("Şebekedeki suyun yaklaşık %18'i kaçaklardan kaybediliyor.")).toBeVisible()

  await engineer.click()
  await page.getByRole('button', { name: /^Su kullanım verisi/ }).first().click()
  await expect(page.getByText('2 / 6 İncelendi')).toBeVisible()
  await expect(page.getByText('%34')).toBeVisible()
  await expect(page.getByText('%40')).toBeVisible()

  const stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.viewedSources).toEqual(['municipality_engineer', 'water_usage'])
  expect(stored.state.events.filter(({ eventType }) => eventType === 'source_opened')).toHaveLength(3)

  await page.reload()
  await expect(page.getByText('2 / 6 İncelendi')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Su kullanım verisi' })).toBeVisible()
})

test('hint is requested once and Research continues without requiring every source', async ({ page }) => {
  await page.getByRole('button', { name: 'İPUCU GÖSTER' }).click()
  await expect(page.getByRole('status')).toContainText('Tüm kaynaklar aynı derecede güvenilir olmayabilir.')
  await expect(page.getByRole('button', { name: 'İPUCU GÖSTER' })).toHaveCount(0)

  await page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()

  const stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.currentScreen).toBe(4)
  expect(stored.state.hintCount).toBe(1)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'hint_requested')).toHaveLength(1)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeVisible()
})

test('Research remains usable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: /^Sosyal medya paylaşımı/ }).first().click()
  await expect(page.getByText('Bu paylaşım doğrulanmamış bir iddiadır.')).toBeVisible()
})
