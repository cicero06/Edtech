import { expect, test } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../src/utils/sessionStorage.ts'
import type { SessionState } from '../src/types/session.ts'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' }).click()
  await page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' }).click()
  await page.getByRole('button', { name: 'Şebeke kaçaklarını onar seç' }).click()
  await page.getByRole('button', { name: 'Yağmur suyu toplama sistemi kur seç' }).click()
  await page.getByRole('button', { name: 'Park sulamasını azalt seç' }).click()
  await page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' }).click()
  await page.getByRole('radio', { name: 'Bütçe ile fayda arasında iyi denge kuruyor.' }).locator('..').click()
  await page.getByRole('radio', { name: '4', exact: true }).locator('..').click()
  await page.getByRole('button', { name: 'PLANI UYGULA' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()
})

test('first Outcome calculates the approved example and records viewed content once', async ({ page }) => {
  await expect(page.getByLabel('Başlangıç kaynakları')).toContainText('Su: %64')
  await expect(page.getByLabel('Başlangıç kaynakları')).toContainText('Bütçe: 3')
  await expect(page.getByText('+22 yüzde puan')).toBeVisible()
  await expect(page.getByText('Önümüzdeki üç ayda yağışların normalin yaklaşık %40 altında kalması bekleniyor.')).toBeVisible()

  await expect.poll(async () => {
    const stored: { state: SessionState } = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
    )
    return stored.state.events.filter(({ eventType }) => eventType === 'outcome_viewed').length
  }).toBe(1)

  let stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.events.filter(({ eventType }) => eventType === 'new_evidence_viewed')).toHaveLength(1)
  expect(stored.state.outcomeViewed).toBe(true)
  expect(stored.state.newEvidenceViewed).toBe(true)

  await page.reload()
  await expect(page.getByText('+22 yüzde puan')).toBeVisible()
  stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'outcome_viewed')).toHaveLength(1)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'new_evidence_viewed')).toHaveLength(1)

  await page.getByRole('button', { name: 'SONUÇLARI DEĞERLENDİR' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()
})

test('final Outcome reuses the screen and applies the revised rainwater delta', async ({ page }) => {
  await page.getByRole('button', { name: 'SONUÇLARI DEĞERLENDİR' }).click()
  await page.getByRole('button', { name: 'Evet', exact: true }).click()
  await page.getByRole('button', { name: /Evet, planımı değiştirmek istiyorum/ }).click()
  await page.getByRole('button', { name: 'DEĞERLENDİRMEYİ TAMAMLA' }).click()
  await page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' }).click()
  await page.getByRole('button', { name: 'PLANI UYGULA' }).click()

  await expect(page.getByText('FİNAL SONUÇ')).toBeVisible()
  await expect(page.getByLabel('Başlangıç kaynakları')).toContainText('Su: %62')
  await expect(page.getByText('+20 yüzde puan')).toBeVisible()
  await expect.poll(async () => {
    const stored: { state: SessionState } = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
    )
    return stored.state.events.filter(({ eventType }) => eventType === 'outcome_viewed').map(({ value }) => value)
  }).toEqual(['first', 'final'])
  await page.getByRole('button', { name: 'OTURUM ÖZETİNİ GÖR' }).click()
  await expect(page.getByRole('heading', { name: 'GÖZLENEN SÜREÇ GÖSTERGELERİ' })).toBeFocused()
})

test('Outcome remains usable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'SONUÇLARI DEĞERLENDİR' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
