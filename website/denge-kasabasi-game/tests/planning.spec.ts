import { completeExploration, completeResearch } from './exploration.ts'
import { expect, test } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../src/utils/sessionStorage.ts'
import type { SessionState } from '../src/types/session.ts'

const readState = async (page: import('@playwright/test').Page): Promise<SessionState> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).state, SESSION_STORAGE_KEY)

test.beforeEach(async ({ page }) => {
  await page.goto('/denge-kasabasi/oyna/')
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await completeExploration(page)
  await page.getByRole('button', { name: 'ÇÖZÜMLERİ İNCELE' }).click()
  await completeResearch(page)
  await page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' }).click()
  await expect(page.getByRole('heading', { name: 'Planını Oluştur', exact: true })).toBeFocused()
})

test('budget, count, removal and persistence stay consistent', async ({ page }) => {
  const summary = page.getByLabel('Seçilen plan özeti')
  const next = page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' })
  await expect(next).toBeDisabled()
  await expect(summary).toContainText('Kalan bütçe: 50')
  await page.getByRole('button', { name: 'Şebeke kaçaklarını onar seç', exact: true }).click()
  await page.getByRole('button', { name: 'Yağmur suyu toplama sistemi kur seç', exact: true }).click()
  await expect(summary).toContainText('Kullanılan bütçe: 45 / 50')
  await expect(page.getByRole('progressbar', { name: 'Kullanılan bütçe' })).toHaveAttribute('value', '45')
  await page.getByRole('button', { name: 'Yeni kuyu aç seç', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('10 bütçe puanına daha ihtiyacın var.')
  expect((await readState(page)).selectedInterventions).toEqual(['network-leak-repair', 'rainwater-harvesting'])
  await page.getByRole('button', { name: 'Park sulamasını azalt seç', exact: true }).click()
  await expect(summary).toContainText('Kullanılan bütçe: 47 / 50')
  await page.getByRole('button', { name: 'Yağmur suyu toplama sistemi kur seçimini kaldır' }).click()
  await page.getByRole('button', { name: 'Tarımsal sulamayı azalt seç', exact: true }).click()
  await page.getByRole('button', { name: 'Yeni kuyu aç seç', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('En fazla 3 çözüm seçebilirsin.')
  await expect(summary).toContainText('Seçilen çözüm: 3 / 3')
  await expect(summary).toContainText('Kullanılan bütçe: 27 / 50')
  const state = await readState(page)
  expect(new Set(state.selectedInterventions).size).toBe(3)
  await page.reload()
  await expect(summary).toContainText('Kalan bütçe: 23')
  await page.getByRole('button', { name: 'Şebeke kaçaklarını onar seçimini kaldır' }).click()
  await page.getByRole('button', { name: 'Park sulamasını azalt seçimini kaldır' }).click()
  await page.getByRole('button', { name: 'Tarımsal sulamayı azalt seçimini kaldır' }).click()
  await expect(next).toBeDisabled()
  await expect(summary).toContainText('Kalan bütçe: 50')
})

test('details reconnect evidence and preserve independent risks', async ({ page }) => {
  await page.getByRole('button', { name: 'Tarımsal sulamayı azalt etkilerini incele' }).click()
  await expect(page.getByRole('region', { name: 'Hasan', exact: true })).toContainText('bazı ürünler zarar görebilir')
  const card = page.locator('.intervention-card').filter({ has: page.getByRole('button', { name: 'Tarımsal sulamayı azalt seç', exact: true }) })
  await card.locator('summary').filter({ hasText: 'Çiftçi' }).click()
  await expect(card).toContainText('kullanılan sulama yöntemi toplam su tüketimini değiştirebilir')
  await expect(card.getByText('✓ Araştırmada inceledin').first()).toBeVisible()
  expect((await readState(page)).selectedInterventions).toEqual([])
  await page.getByRole('button', { name: 'Tarımsal sulamayı azalt seç', exact: true }).click()
  await page.getByRole('button', { name: 'Yağmur suyu toplama sistemi kur seç', exact: true }).click()
  await page.getByRole('button', { name: 'Yeni kuyu aç seç', exact: true }).click()
  const summary = page.getByLabel('Seçilen plan özeti')
  await expect(summary).toContainText('+33 yüzde puan')
  await expect(summary).toContainText('Ürün verimi azalabilir')
  await expect(summary).toContainText('Uzun vadede belirsizlik var')
  await expect(summary).toContainText('Yüksek fayda potansiyeli')
  await expect(page.locator('.plan-feedback')).toContainText('Planında çevresel belirsizlik')
})

for (const count of [1, 2, 3]) {
  test(`${count} solution plan can be edited and confirmed without spending all the budget`, async ({ page }) => {
    for (const name of ['Şebeke kaçaklarını onar', 'Park sulamasını azalt', 'Yeni kuyu aç'].slice(0, count)) {
      await page.getByRole('button', { name: `${name} seç`, exact: true }).click()
    }
    const next = page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' })
    await next.click()
    const confirmation = page.getByRole('region', { name: 'Planını kontrol et' })
    await expect(confirmation).toBeVisible()
    await expect(confirmation.getByRole('listitem')).toHaveCount(count)
    expect((await readState(page)).currentScreen).toBe(4)
    const selected = (await readState(page)).selectedInterventions
    await page.getByRole('button', { name: 'DEĞİŞTİR', exact: true }).click()
    await expect(next).toBeFocused()
    expect((await readState(page)).selectedInterventions).toEqual(selected)
    await next.click()
    await page.getByRole('button', { name: 'PLANI ONAYLA', exact: true }).click()
    expect((await readState(page)).currentScreen).toBe(5)
    await expect(page.getByRole('button', { name: 'PLANI UYGULA' })).toBeVisible()
  })
}

for (const width of [1440, 375]) {
  test(`planning and confirmation remain usable at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    for (const name of ['Şebeke kaçaklarını onar', 'Tarımsal sulamayı azalt', 'Park sulamasını azalt', 'Yağmur suyu toplama sistemi kur', 'Yeni kuyu aç']) {
      await page.getByRole('button', { name: `${name} etkilerini incele` }).click()
      await expect(page.getByRole('region', { name: `${name} ayrıntıları` })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    await page.getByRole('button', { name: 'Park sulamasını azalt seç', exact: true }).click()
    await page.screenshot({ path: testInfo.outputPath('planning.png'), fullPage: true })
    await page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' }).click()
    await expect(page.getByRole('heading', { name: 'Planını kontrol et' })).toBeFocused()
    await page.screenshot({ path: testInfo.outputPath('confirmation.png'), fullPage: true })
    await page.getByRole('button', { name: 'PLANI ONAYLA' }).click()
    await expect(page.getByRole('button', { name: 'PLANI UYGULA' })).toBeVisible()
    expect(errors).toEqual([])
  })
}
