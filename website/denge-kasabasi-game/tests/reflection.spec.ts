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
  await page.getByRole('button', { name: 'SONUÇLARI DEĞERLENDİR' }).click()
  await expect(page.getByRole('heading', { name: 'GÖREV', exact: true })).toBeFocused()
})

test('keeping the plan opens a score-free summary and completes once', async ({ page }) => {
  const completeReflection = page.getByRole('button', { name: 'DEĞERLENDİRMEYİ TAMAMLA' })
  await expect(completeReflection).toBeDisabled()
  await page.getByRole('button', { name: 'Evet', exact: true }).click()
  await page.getByRole('button', { name: /Hayır, mevcut planımı koruyorum/ }).click()
  await expect(completeReflection).toBeEnabled()
  await completeReflection.click()

  await expect(page.getByRole('heading', { name: 'GÖZLENEN SÜREÇ GÖSTERGELERİ' })).toBeFocused()
  await expect(page.getByText('Oluşturulan plan sayısı').locator('..')).toContainText('1')
  await expect(page.getByText('Yeni kanıt görüntülendi').locator('..')).toContainText('Evet')
  await expect(page.getByText('Yeni kanıt sonrası strateji değiştirildi').locator('..')).toContainText('Hayır')
  await expect(page.getByText('Reflection tamamlandı').locator('..')).toContainText('Evet')
  await expect(page.getByText('Bu göstergeler gözlenen etkileşim süreçlerini tanımlar. Bunlar doğrulanmış yetkinlik puanları değildir.')).toBeVisible()

  await page.getByRole('button', { name: 'DEMOYU TAMAMLA' }).click()
  await expect(page.getByRole('status')).toContainText('Anonim oturum tamamlandı.')
  await expect(page.getByRole('button', { name: 'DEMO TAMAMLANDI' })).toBeDisabled()

  let stored: { state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.events.filter(({ eventType }) => eventType === 'reflection_answered')).toHaveLength(1)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'session_completed')).toHaveLength(1)
  expect(stored.state.completed).toBe(true)
  await page.reload()
  stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'session_completed')).toHaveLength(1)
})

test('changing the plan allows exactly one revision and then final Outcome', async ({ page }) => {
  await page.getByRole('button', { name: 'Hayır', exact: true }).click()
  await page.getByRole('button', { name: /Evet, planımı değiştirmek istiyorum/ }).click()
  await page.getByRole('button', { name: 'DEĞERLENDİRMEYİ TAMAMLA' }).click()

  await expect(page.getByText('Seçilen çözüm:').locator('..')).toContainText('3 / 3')
  await page.getByRole('button', { name: 'Yağmur suyu toplama sistemi kur seçimini kaldır' }).click()
  await page.getByRole('button', { name: 'Yeni kuyu aç seç' }).click()
  await page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' }).click()
  await page.getByRole('button', { name: 'PLANI UYGULA' }).click()

  await expect(page.getByText('FİNAL SONUÇ')).toBeVisible()
  await expect(page.getByLabel('Başlangıç kaynakları')).toContainText('Su: %71')
  await page.getByRole('button', { name: 'OTURUM ÖZETİNİ GÖR' }).click()
  await expect(page.getByText('Oluşturulan plan sayısı').locator('..')).toContainText('2')
  await expect(page.getByText('Yeni kanıt sonrası strateji değiştirildi').locator('..')).toContainText('Evet')

  const stored: { state: SessionState } = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY,
  )
  expect(stored.state.revisionCount).toBe(1)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'plan_revised')).toHaveLength(1)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'plan_submitted')).toHaveLength(2)
  expect(stored.state.events.filter(({ eventType }) => eventType === 'outcome_viewed')).toHaveLength(2)
})

test('Reflection remains usable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'DEĞERLENDİRMEYİ TAMAMLA' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
