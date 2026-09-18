import type { Page } from '@playwright/test'

export async function completeExploration(page: Page) {
  for (const name of ['Baraj', 'Evler', 'Tarım', 'Park', 'Belediye']) {
    await page.getByRole('button', { name: new RegExp(`^${name}:`) }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'İNCELEMEYİ TAMAMLA' }).click()
  }
}

export async function completeResearch(page: Page) {
  if (await page.getByRole('button', { name: 'PLAN OLUŞTURMAYA GEÇ' }).isEnabled()) return
  for (const name of ['Belediye mühendisi', 'Çiftçi', 'Çevre uzmanı', 'Su kullanım verisi', 'Sosyal medya paylaşımı', 'Belediye bütçe bilgisi']) {
    await page.getByRole('button', { name: new RegExp(`^${name}`) }).click()
    const review = page.getByRole('button', { name: 'KAYNAĞI İNCELEDİM', exact: true })
    if (await review.count()) await review.click()
  }
}
