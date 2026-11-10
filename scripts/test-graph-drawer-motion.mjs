import assert from 'node:assert/strict'
import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:5173'}/graph`, { waitUntil: 'networkidle0' })
  const sample = () => page.evaluate(async () => {
    const drawer = document.getElementById('graph-mobile-panel')
    const toggle = document.querySelector('[aria-controls="graph-mobile-details"]')
    const heights = [drawer.getBoundingClientRect().height]
    toggle.click()
    const started = performance.now()
    while (performance.now() - started < 450) {
      await new Promise(requestAnimationFrame)
      heights.push(drawer.getBoundingClientRect().height)
    }
    return { heights, expanded: toggle.getAttribute('aria-expanded'), inert: drawer.inert }
  })
  const opening = await sample()
  assert.equal(opening.expanded, 'true')
  assert.equal(opening.heights[0], 0)
  assert.ok(opening.heights.at(-1) > 0)
  assert.ok(new Set(opening.heights.map(Math.round)).size > 2, 'Opening must interpolate, not jump')
  assert.equal(opening.inert, false)
  const closing = await sample()
  assert.equal(closing.expanded, 'false')
  assert.equal(closing.heights.at(-1), 0)
  assert.ok(new Set(closing.heights.map(Math.round)).size > 2, 'Closing must interpolate, not jump')
  assert.equal(closing.inert, true, 'Closed controls must not receive focus')
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await new Promise(resolve => setTimeout(resolve, 100))
  const reduced = await sample()
  assert.ok(reduced.heights.at(-1) > 0)
  assert.ok(new Set(reduced.heights.map(Math.round)).size <= 2, 'Reduced motion must skip interpolation')
  console.log('PASS drawer eases open and closed, disables hidden controls, and respects reduced motion')
} finally {
  await browser.close()
}
