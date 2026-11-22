import assert from 'node:assert/strict'
import puppeteer from 'puppeteer'

const site = process.env.SITE_URL || 'http://127.0.0.1:5173'
const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.evaluateOnNewDocument(() => {
    window.graphWork = { started: 0, active: 0, cancelledAt: 0 }
    const NativeWorker = window.Worker
    window.Worker = class extends NativeWorker {
      stopped = false
      constructor(...args) {
        super(...args)
        window.graphWork.started++
        window.graphWork.active++
      }
      terminate() {
        if (!this.stopped) {
          this.stopped = true
          window.graphWork.active--
          window.graphWork.cancelledAt = performance.now()
        }
        super.terminate()
      }
    }
  })
  await page.goto(`${site}/graph/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.graphWork.active > 0)
  const clicked = await page.evaluate(() => {
    const now = performance.now()
    document.querySelector('nav a[href="/"]').click()
    return now
  })
  await page.waitForFunction(() => window.graphWork.active === 0, { timeout: 1000 })
  const stopped = await page.evaluate(() => window.graphWork.cancelledAt)
  assert.ok(stopped - clicked < 250, `Cancellation took ${stopped - clicked}ms`)
  await page.waitForFunction(() => document.querySelector('h1')?.textContent.includes('Procko'))
  assert.equal(new URL(page.url()).pathname, '/')
  assert.equal(await page.$('canvas'), null, 'Cancelled graph did not reappear')
  console.log(`Leaving during layout terminated the worker in ${Math.round(stopped - clicked)}ms`)

  await page.evaluate(() => document.querySelector('nav a[href="/graph"]').click())
  await page.waitForFunction(() => {
    const element = [...document.querySelectorAll('div')].find(el => el._cyreg?.cy)
    return window.graphWork.started >= 2 && window.graphWork.active === 0
      && element && [...document.querySelectorAll('div')].some(el => el.textContent?.startsWith('total: ') && el.textContent.includes('nodes'))
  }, { timeout: 30000 })
  const positions = await page.evaluate(() => {
    const cy = [...document.querySelectorAll('div')].find(el => el._cyreg?.cy)._cyreg.cy
    return cy.nodes().map(node => node.position())
  })
  assert.ok(positions.length > 100)
  assert.ok(positions.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)))
  assert.ok(new Set(positions.map(p => `${Math.round(p.x)},${Math.round(p.y)}`)).size > positions.length / 2)
  console.log(`Returning computes a valid layout for ${positions.length} nodes`)

  await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.includes('Reset Layout')).click())
  await page.waitForFunction(() => window.graphWork.active > 0)
  await page.evaluate(() => document.querySelector('nav a[href="/"]').click())
  await page.waitForFunction(() => window.graphWork.active === 0, { timeout: 1000 })
  await page.waitForFunction(() => document.querySelector('h1')?.textContent.includes('Procko'))
  assert.deepEqual(errors, [])
  console.log('Reset Layout is also interruptible; no browser errors')
} finally {
  await browser.close()
}
