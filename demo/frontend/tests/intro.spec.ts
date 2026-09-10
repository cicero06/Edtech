import { expect, test } from '@playwright/test'
import { SESSION_STORAGE_KEY } from '../src/utils/sessionStorage.ts'
import type { SessionState } from '../src/types/session.ts'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

test('Intro loads local artwork, starts once and resumes after refresh without console errors', async ({ page }, testInfo) => {
  const errors: string[] = []
  const requests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('request', (request) => requests.push(request.url()))

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SU KRİZİ', exact: true })).toBeVisible()
  await expect(page.getByText('Görev 1 / 7')).toBeVisible()
  await expect(page.getByText('Kasabanın su ihtiyacını karşıla, çevreyi koru ve bütçeyi aşma.')).toBeVisible()
  const image = page.getByRole('img', { name: /Denge Kasabası:/ })
  await expect(image).toBeVisible()
  await expect(image).toHaveAttribute('src', '/assets/town-intro.jpg')
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth === 512)).toBe(true)
  const asset = await page.request.get('/assets/town-intro.jpg')
  expect(asset.status()).toBe(200)
  expect(asset.headers()['content-type']).toContain('image/jpeg')
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_STORAGE_KEY)).toBeNull()
  await page.screenshot({ path: testInfo.outputPath('intro-desktop.png'), fullPage: true })

  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
  })
  await expect(page.getByRole('heading', { name: '02 — Town Map' })).toBeVisible()
  const stored: { version: number; state: SessionState } = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY)
  expect(stored.version).toBe(1)
  expect(stored.state.sessionId).toMatch(uuidPattern)
  expect(stored.state.currentScreen).toBe(2)
  expect(stored.state.events).toHaveLength(1)
  expect(stored.state.events[0]).toEqual({
    eventType: 'session_started',
    screen: 'intro',
    timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
  })
  expect(Object.keys(stored.state).sort()).toEqual([
    'sessionId', 'currentScreen', 'exploredLocations', 'viewedSources', 'selectedInterventions',
    'selectedReason', 'confidence', 'outcomeViewed', 'newEvidenceViewed', 'reflectionUnexpectedResult',
    'wantsRevision', 'revisionCount', 'hintCount', 'completed', 'events',
  ].sort())

  await page.reload()
  await expect(page.getByRole('heading', { name: '02 — Town Map' })).toBeVisible()
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SESSION_STORAGE_KEY)).toEqual(stored)
  expect(errors).toEqual([])
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:5174')).toBe(true)
})

test('keyboard activation starts an anonymous session', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'GÖREVE BAŞLA' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: '02 — Town Map' })).toBeFocused()
})

test('corrupted or unknown-version storage recovers to Intro', async ({ page }) => {
  await page.goto('/')
  for (const data of ['{broken-json', JSON.stringify({ version: 99, state: {} })]) {
    await page.evaluate(({ key, data }) => localStorage.setItem(key, data), { key: SESSION_STORAGE_KEY, data })
    await page.reload()
    await expect(page.getByRole('heading', { name: 'SU KRİZİ', exact: true })).toBeVisible()
  }
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await expect(page.getByRole('heading', { name: '02 — Town Map' })).toBeVisible()
})

test('storage denial does not crash the start action and explains refresh limitations', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage is unavailable', 'SecurityError') }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  await expect(page.getByRole('heading', { name: '02 — Town Map' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Sayfayı yenilersen ilerleme kaybolabilir.')
  expect(errors).toEqual([])
})

test('storage helpers reset only this anonymous session', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
  const reset = await page.evaluate(async (key) => {
    localStorage.setItem('unrelated-setting', 'keep')
    const helpers = await import(new URL('/src/utils/sessionStorage.ts', location.origin).href)
    const state = helpers.resetSession()
    return { state, loaded: helpers.loadSessionState(), stored: JSON.parse(localStorage.getItem(key)!), other: localStorage.getItem('unrelated-setting') }
  }, SESSION_STORAGE_KEY)
  expect(reset.state.sessionId).toBeNull()
  expect(reset.state.currentScreen).toBe(1)
  expect(reset.state.events).toEqual([])
  expect(reset.loaded).toEqual(reset.state)
  expect(reset.stored.state).toEqual(reset.state)
  expect(reset.other).toBe('keep')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'SU KRİZİ', exact: true })).toBeVisible()
})

for (const width of [1280, 1024, 768, 375]) {
  test(`Intro remains usable at ${width}px width`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'GÖREVE BAŞLA' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`intro-${width}.png`), fullPage: true })
    await page.getByRole('button', { name: 'GÖREVE BAŞLA' }).click()
    await expect(page.getByRole('heading', { name: '02 — Town Map' })).toBeVisible()
  })
}
