import assert from 'node:assert/strict'
import puppeteer from 'puppeteer'

const site = process.env.SITE_URL || 'http://127.0.0.1:5173'
const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${site}/projects`, { waitUntil: 'networkidle0' })
  assert.equal(await page.$('[data-page-transition]'), null, 'No transition on direct loading')
  const boundaries = await page.evaluate(() => {
    const main = document.querySelector('main')
    main.scrollTop = main.scrollHeight
    return { top: main.getBoundingClientRect().top, bottom: main.querySelector('footer').getBoundingClientRect().top }
  })
  await page.evaluate(() => document.querySelector('a[href="/papers"]').click())
  await page.waitForSelector('[data-page-transition]', { timeout: 1000 })
  const bounds = await page.$eval('[data-page-transition]', el => ({ top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom, text: el.textContent }))
  assert.ok(Math.abs(bounds.top - boundaries.top) < 1, 'Header remains outside the transition')
  assert.ok(Math.abs(bounds.bottom - boundaries.bottom) < 1, 'Visible footer remains outside the transition')
  assert.ok(bounds.text.includes('cd ~/papers'))
  assert.equal(await page.$eval('h1', el => el.textContent), 'Projects', 'Keep the outgoing page until covered')
  const timing = await page.$eval('[data-page-transition]', el => ({
    hidden: el.getAttribute('aria-hidden'),
    pointerEvents: getComputedStyle(el).pointerEvents,
    ends: el.getAnimations({ subtree: true }).map(a => a.effect.getComputedTiming().endTime),
  }))
  assert.equal(timing.hidden, 'true')
  assert.equal(timing.pointerEvents, 'none')
  assert.ok(timing.ends.length > 0)
  assert.ok(timing.ends.every(end => end <= 1000))
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Publications', { timeout: 2000 })
  await page.waitForSelector('[data-page-transition]', { hidden: true, timeout: 1000 })
  console.log('Outgoing content held until covered; geometric animation lasts less than one second')

  await page.evaluate(() => document.querySelector('a[href="/papers"]').click())
  assert.equal(await page.$('[data-page-transition]'), null, 'No wipe for the same page')
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Projects')
  await page.waitForSelector('[data-page-transition]', { hidden: true })

  // Rapid navigation must cancel stale page swaps.
  await page.evaluate(() => {
    document.querySelector('a[href="/papers"]').click()
    setTimeout(() => document.querySelector('a[href="/about"]').click(), 80)
  })
  await page.waitForFunction(() => document.querySelector('h1')?.textContent.includes('about'))
  await page.waitForSelector('[data-page-transition]', { hidden: true })
  assert.equal(new URL(page.url()).pathname, '/about')
  console.log('Same-page links, browser Back, and rapid navigation work')

  await page.setViewport({ width: 390, height: 844 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.evaluate(() => document.querySelector('a[href="/projects"]').click())
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Projects')
  assert.equal(await page.$('[data-page-transition]'), null, 'Reduced motion skips the effect')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await page.emulateCPUThrottling(4)
  await page.evaluate(() => {
    const started = performance.now()
    window.transitionAudit = { elapsed: null, graphDuringWipe: false }
    let seen = false
    const observer = new MutationObserver(() => {
      const overlay = document.querySelector('[data-page-transition]')
      if (overlay) seen = true
      if (document.querySelector('canvas') && overlay) window.transitionAudit.graphDuringWipe = true
      if (seen && !overlay && window.transitionAudit.elapsed === null) window.transitionAudit.elapsed = performance.now() - started
      if (document.querySelector('canvas')) observer.disconnect()
    })
    observer.observe(document.querySelector('main'), { childList: true, subtree: true })
    document.querySelector('nav a[href="/graph"]').click()
  })
  await page.waitForFunction(() => [...document.querySelectorAll('div')].some(el => el._cyreg?.cy?.nodes(':visible').length), { timeout: 30000 })
  const graph = await page.evaluate(() => window.transitionAudit)
  assert.equal(graph.graphDuringWipe, false, 'Graph rendering starts after the transition is removed')
  assert.ok(graph.elapsed > 0 && graph.elapsed < 1000, `Wipe completed in ${graph.elapsed}ms under CPU throttling`)
  console.log(`Graph transition completed in ${Math.round(graph.elapsed)}ms at 4× CPU slowdown; graph mounts afterwards`)
  assert.deepEqual(errors, [])
  console.log('Reduced motion and mobile layout pass')
} finally {
  await browser.close()
}
