import { expect, test } from '@playwright/test'

const gamePath = '/denge-kasabasi/oyna/'

for (const width of [1440, 375]) {
  test(`Lina guides exploration and preserves visits at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await page.goto(gamePath)
    const dialogue = page.getByRole('region', { name: 'Lina', exact: true })
    await expect(dialogue).toContainText('Merhaba! Ben Lina.')
    const portrait = dialogue.getByRole('img')
    await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await page.screenshot({ path: testInfo.outputPath('lina-intro.png'), fullPage: true })
    for (let step = 1; step < 9; step++) {
      await expect(dialogue).toContainText(`${step} / 9`)
      await dialogue.getByRole('button', { name: 'Devam', exact: true }).click()
    }
    await expect(dialogue).toContainText('Haydi, önce kasabayı birlikte keşfedelim!')
    await dialogue.getByRole('button', { name: 'Haydi keşfedelim!' }).click()
    await expect(page.getByRole('heading', { name: 'İlk Görevin' })).toBeFocused()
    await expect(dialogue).toContainText('Kasabamızın suya nerelerde ihtiyaç duyduğunu bul.')
    const progress = page.getByRole('status', { name: 'Görev ilerlemesi' })
    await expect(progress).toHaveText('0/5 Bölge İncelendi')
    const regions = ['Baraj', 'Evler', 'Tarım', 'Park', 'Belediye']
    for (const [index, region] of regions.entries()) {
      await page.getByRole('button', { name: new RegExp(`^${region}:`) }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'İNCELEMEYİ TAMAMLA' }).click()
      await expect(progress).toHaveText(`${index + 1}/5 Bölge İncelendi`)
    }
    await page.getByRole('button', { name: /^Baraj:/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'İNCELEMEYİ TAMAMLA' }).click()
    await expect(dialogue).toContainText('Harika! Kasabanın tüm bölgelerini inceledin.')
    await expect(progress).toHaveText('5/5 Bölge İncelendi')
    await page.reload()
    await expect(progress).toHaveText('5/5 Bölge İncelendi')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('lina-first-task.png'), fullPage: true })
    await page.getByRole('button', { name: 'ÇÖZÜMLERİ İNCELE' }).click()
    await page.getByRole('button', { name: /Önceki Adım/ }).click()
    await expect(progress).toHaveText('5/5 Bölge İncelendi')
    expect(errors).toEqual([])
  })
}

test('missing portrait falls back and reduced motion stops idle animation', async ({ page }) => {
  await page.route('**/characters/lina.svg', (route) => route.fulfill({ status: 404, body: '' }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(gamePath)
  const portrait = page.getByRole('region', { name: 'Lina' }).getByRole('img')
  await expect(portrait).toHaveText('👧')
  await expect(portrait).toHaveCSS('animation-name', 'none')
  await page.getByRole('button', { name: 'Devam', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Lina' })).toContainText('Barajdaki su seviyesi düşüyor.')
})
