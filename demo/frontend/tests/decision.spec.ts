import { expect, test } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../src/utils/sessionStorage.ts'
import type { SessionState } from '../src/types/session.ts'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' }).click()
  await page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' }).click()
  await page.getByRole('button', { name: 'Şebeke kaçaklarını onar seç' }).click()
  await page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()
})

test('Decision records approved structured answers and submits the selected plan', async ({ page }) => {
  const applyButton = page.getByRole('button', { name: 'PLANI UYGULA' })
  await expect(page.getByLabel('Seçilen plan özeti')).toContainText('Kalan bütçe: 30')
  await expect(applyButton).toBeDisabled()

  const reason = page.getByRole('radio', { name: 'Bütçe ile fayda arasında iyi denge kuruyor.' })
  await reason.locator('..').click()
  await expect(reason).toBeChecked()
  await expect(applyButton).toBeDisabled()
  const confidence = page.getByRole('radio', { name: '4', exact: true })
  await confidence.locator('..').click()
  await expect(confidence).toBeChecked()
  await expect(applyButton).toBeEnabled()
  await applyButton.click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()

  const stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.selectedReason).toBe('budget-balance')
  expect(stored.state.confidence).toBe(4)
  expect(stored.state.events.filter(({ screen }) => screen === 'decision').slice(-3)).toEqual([
    expect.objectContaining({ eventType: 'reason_selected', screen: 'decision', target: 'budget-balance' }),
    expect.objectContaining({ eventType: 'confidence_submitted', screen: 'decision', value: 4 }),
    expect.objectContaining({ eventType: 'plan_submitted', screen: 'decision', value: ['network-leak-repair'] }),
  ])

  await page.reload()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeVisible()
})

test('Other remains structured and never opens a free-text response', async ({ page }) => {
  await page.getByRole('radio', { name: 'Diğer', exact: true }).locator('..').click()
  await expect(page.locator('textarea')).toHaveCount(0)
  await expect(page.locator('input[type="text"]')).toHaveCount(0)
  await page.getByRole('radio', { name: '1', exact: true }).locator('..').click()
  await page.getByRole('button', { name: 'PLANI UYGULA' }).click()

  const stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.selectedReason).toBe('other')
  expect(JSON.stringify(stored)).not.toContain('freeText')
})

test('Decision remains usable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'PLANI UYGULA' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('radio', { name: 'Çevreye daha az zarar vereceğini düşünüyorum.' }).locator('..').click()
  await page.getByRole('radio', { name: '5', exact: true }).locator('..').click()
  await expect(page.getByRole('button', { name: 'PLANI UYGULA' })).toBeEnabled()
})
