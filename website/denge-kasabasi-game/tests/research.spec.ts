import { completeExploration, completeResearch } from './exploration.ts'
import { expect, test } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../src/utils/sessionStorage.ts'
import type { SessionState } from '../src/types/session.ts'

const sources = ['Belediye mühendisi', 'Çiftçi', 'Çevre uzmanı', 'Su kullanım verisi', 'Sosyal medya paylaşımı', 'Belediye bütçe bilgisi']
const readState = async (page: import('@playwright/test').Page): Promise<SessionState> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).state, SESSION_STORAGE_KEY)

test.beforeEach(async ({ page }) => {
  await page.goto('/denge-kasabasi/oyna/')
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await completeExploration(page)
  await page.getByRole('button', { name: 'ÇÖZÜMLERİ İNCELE' }).click()
})

test('selection alone never completes a source; explicit review persists without duplicates', async ({ page }) => {
  const progress = page.getByRole('status', { name: 'Kaynak ilerlemesi' })
  const next = page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' })
  await expect(progress).toHaveText('0 / 6 kaynak incelendi')
  await expect(next).toBeDisabled()
  await expect(page.locator('.source-checklist')).toHaveCount(0)
  const engineer = page.getByRole('button', { name: /^Belediye mühendisi/ })
  await engineer.click()
  await expect(page.getByRole('region', { name: 'Derya', exact: true })).toContainText('gelecekteki ihtiyacı')
  await expect(engineer).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: /^Çiftçi/ }).click()
  expect((await readState(page)).viewedSources).toEqual([])
  await page.reload()
  await expect(progress).toHaveText('0 / 6 kaynak incelendi')
  await engineer.click()
  await page.getByRole('button', { name: 'KAYNAĞI İNCELEDİM', exact: true }).click()
  await expect(engineer).toContainText('✓ İncelendi')
  await page.getByRole('button', { name: /^Çiftçi/ }).click()
  await engineer.click()
  await expect(page.getByRole('button', { name: '✓ KAYNAK İNCELENDİ' })).toBeDisabled()
  await page.reload()
  await expect(progress).toHaveText('1 / 6 kaynak incelendi')
  await expect(page.getByRole('heading', { name: 'Belediye mühendisi' })).toBeVisible()
  const state = await readState(page)
  expect(state.viewedSources).toEqual(['municipality_engineer'])
  expect(state.events.filter(({ eventType }) => eventType === 'source_opened')).toHaveLength(1)
  await expect(next).toBeDisabled()
})

for (const width of [1440, 375]) {
  test(`all six sources, chart, budget and planning work at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    await page.setViewportSize({ width, height: 900 })
    const progress = page.getByRole('status', { name: 'Kaynak ilerlemesi' })
    const next = page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' })
    for (const [index, name] of sources.entries()) {
      await page.getByRole('button', { name: new RegExp(`^${name}`) }).click()
      const detail = page.getByRole('region', { name, exact: true })
      await expect(detail.getByRole('heading', { name: 'Bu kaynaktan ne öğrendik?' })).toBeVisible()
      if (index < 3) {
        const portrait = detail.getByRole('img')
        await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
        await expect(detail).toContainText(['Derya', 'Hasan', 'Zeynep'][index])
      }
      if (index === 3) {
        for (const percentage of ['%34', '%40', '%8', '%18']) await expect(detail.getByText(percentage, { exact: true })).toBeVisible()
        await expect(detail.getByText('Kaçaklar', { exact: true })).toBeVisible()
      }
      if (index === 4) {
        await expect(detail).toContainText('Hayır. Paylaşımda kaynak veya resmî veri belirtilmemiş.')
        await expect(detail).toContainText('başka kaynaklarla karşılaştırmak')
      }
      if (index === 5) await expect(detail).toContainText('Başlangıç bütçesi: 50 birim')
      await expect(progress).toHaveText(`${index} / 6 kaynak incelendi`)
      await expect(next).toBeDisabled()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if ([0, 3, 4, 5].includes(index)) await page.screenshot({ path: testInfo.outputPath(`research-${index}.png`), fullPage: true })
      await page.getByRole('button', { name: 'KAYNAĞI İNCELEDİM', exact: true }).click()
      await expect(progress).toHaveText(`${index + 1} / 6 kaynak incelendi`)
    }
    await expect(next).toBeEnabled()
    await expect(page.getByRole('region', { name: 'Lina' })).toContainText('Harika! Artık farklı görüşleri')
    await page.reload()
    await expect(progress).toHaveText('6 / 6 kaynak incelendi')
    await next.click()
    await expect(page.getByRole('button', { name: 'KARAR AŞAMASINA GEÇ' })).toBeVisible()
    expect((await readState(page)).currentScreen).toBe(4)
    await page.getByRole('button', { name: /Önceki Adım/ }).click()
    await expect(progress).toHaveText('6 / 6 kaynak incelendi')
    await expect(next).toBeEnabled()
    expect(errors).toEqual([])
  })
}

test('hint prompts comparison once and survives refresh', async ({ page }) => {
  await page.getByRole('button', { name: 'İPUCU GÖSTER' }).click()
  await expect(page.getByRole('status', { name: 'Araştırma ipucu' })).toContainText('Farklı kaynak türlerini karşılaştır.')
  await page.reload()
  await expect(page.getByRole('button', { name: 'İPUCU GÖSTER' })).toHaveCount(0)
  await completeResearch(page)
  const state = await readState(page)
  expect(state.hintCount).toBe(1)
  expect(state.events.filter(({ eventType }) => eventType === 'hint_requested')).toHaveLength(1)
})
