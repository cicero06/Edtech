import { expect, test } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../src/utils/sessionStorage.ts'
import type { SessionState } from '../src/types/session.ts'

const readStoredState = async (page: import('@playwright/test').Page): Promise<SessionState> => {
  const stored: { version: number; state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  return stored.state
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('Önceki Adım only moves through permitted screens', async ({ page }) => {
  const back = page.getByRole('button', { name: /Önceki Adım/ })

  await expect(back).toHaveCount(0)
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await expect(page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' })).toBeVisible()
  await expect(back).toHaveCount(0)

  await page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' }).click()
  await expect(page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' })).toBeVisible()
  await back.click()
  await expect(page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' })).toBeVisible()
  expect((await readStoredState(page)).currentScreen).toBe(2)
  expect((await readStoredState(page)).events).toHaveLength(1)

  await page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' }).click()
  await page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' }).click()
  await expect(page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' })).toBeVisible()
  await back.click()
  await expect(page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' })).toBeVisible()
  expect((await readStoredState(page)).currentScreen).toBe(3)

  await page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' }).click()
  await page.getByRole('button', { name: 'Şebeke kaçaklarını onar seç' }).click()
  await page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' }).click()
  await expect(page.getByRole('button', { name: 'PLANI UYGULA' })).toBeVisible()
  await back.click()
  await expect(page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' })).toBeVisible()
  expect((await readStoredState(page)).currentScreen).toBe(4)
  expect((await readStoredState(page)).selectedInterventions).toEqual(['network-leak-repair'])
})

test('Önceki Adım stays blocked after plan submission and during revision planning', async ({ page }) => {
  const back = page.getByRole('button', { name: /Önceki Adım/ })

  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' }).click()
  await page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' }).click()
  await page.getByRole('button', { name: 'Şebeke kaçaklarını onar seç' }).click()
  await page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' }).click()
  await page.getByRole('radio', { name: 'Bütçe ile fayda arasında iyi denge kuruyor.' }).locator('..').click()
  await page.getByRole('radio', { name: '4', exact: true }).locator('..').click()
  await page.getByRole('button', { name: 'PLANI UYGULA' }).click()

  await expect(page.getByRole('button', { name: 'SONUÇLARI DEĞERLENDİR' })).toBeVisible()
  await expect(back).toHaveCount(0)

  await page.getByRole('button', { name: 'SONUÇLARI DEĞERLENDİR' }).click()
  await expect(page.getByRole('button', { name: 'DEĞERLENDİRMEYİ TAMAMLA' })).toBeVisible()
  await back.click()
  await expect(page.getByRole('button', { name: 'SONUÇLARI DEĞERLENDİR' })).toBeVisible()

  let state = await readStoredState(page)
  expect(state.currentScreen).toBe(6)
  expect(state.events.filter(({ eventType }) => eventType === 'outcome_viewed')).toHaveLength(1)
  expect(state.events.filter(({ eventType }) => eventType === 'new_evidence_viewed')).toHaveLength(1)

  await page.getByRole('button', { name: 'SONUÇLARI DEĞERLENDİR' }).click()
  await page.getByRole('button', { name: 'Evet', exact: true }).click()
  await page.getByRole('button', { name: /Evet, planımı değiştirmek istiyorum/ }).click()
  await page.getByRole('button', { name: 'DEĞERLENDİRMEYİ TAMAMLA' }).click()

  await expect(page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' })).toBeVisible()
  await expect(back).toHaveCount(0)
  state = await readStoredState(page)
  expect(state.currentScreen).toBe(4)
  expect(state.revisionCount).toBe(1)

  await page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' }).click()
  await page.getByRole('button', { name: 'PLANI UYGULA' }).click()
  await page.getByRole('button', { name: 'OTURUM ÖZETİNİ GÖR' }).click()
  await expect(page.getByRole('button', { name: 'DEMOYU TAMAMLA' })).toBeVisible()
  await expect(back).toHaveCount(0)
})

test('Yeni Oturum clears the anonymous session and returns to Intro', async ({ page }) => {
  const reset = page.getByRole('button', { name: 'Yeni Oturum' })
  await expect(reset).toHaveCount(0)

  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await expect(page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' })).toBeVisible()
  await expect(reset).toBeVisible()

  page.once('dialog', (dialog) => void dialog.dismiss())
  await reset.click()
  await expect(page.getByRole('button', { name: 'BİLGİLERİ ARAŞTIR' })).toBeVisible()

  page.once('dialog', (dialog) => void dialog.accept())
  await reset.click()
  await expect(page.getByRole('heading', { name: 'SU KRİZİ', exact: true })).toBeVisible()

  const state = await readStoredState(page)
  expect(state.sessionId).toBeNull()
  expect(state.currentScreen).toBe(1)
  expect(state.events).toEqual([])

  await page.reload()
  await expect(page.getByRole('heading', { name: 'SU KRİZİ', exact: true })).toBeVisible()
  await expect(reset).toHaveCount(0)
})
