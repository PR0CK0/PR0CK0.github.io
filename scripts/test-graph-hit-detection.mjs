import assert from 'node:assert/strict'
import puppeteer from 'puppeteer'

// Use real pointer input at exact model coordinates, without the former x offset.
const browser = await puppeteer.launch({ headless: true })
try {
  for (const touch of [false, true]) {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewport({ width: 390, height: 844, hasTouch: touch, isMobile: touch })
    await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:5173'}/graph`, { waitUntil: 'networkidle0' })
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(el => el.textContent.includes('graph controls') && el.textContent.includes('total:')))
    await new Promise(resolve => setTimeout(resolve, 350))
    await page.evaluate(() => {
      const cy = [...document.querySelectorAll('div')].find(el => el._cyreg?.cy)._cyreg.cy
      window.nodeTaps = []
      cy.on('tap', 'node', event => window.nodeTaps.push(event.target.id()))
    })
    for (const type of ['person', 'associate']) {
      for (const zoom of [0.5, 1, 2]) {
        for (const axisFraction of [0, -0.25, 0.25]) {
          const target = await page.evaluate(async ({ type, zoom, axisFraction }) => {
            const cy = [...document.querySelectorAll('div')].find(el => el._cyreg?.cy)._cyreg.cy
            const node = cy.nodes().filter(n => n.data('type') === type).first()
            cy.stop(true)
            cy.elements().stop(true).hide()
            node.show().position({ x: 0, y: 0 })
            cy.zoom(zoom)
            cy.pan({ x: 180, y: 120 })
            cy.forceRender()
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
            window.nodeTaps = []
            const point = node.renderedPosition()
            const box = cy.container().getBoundingClientRect()
            return { x: box.left + point.x, y: box.top + point.y + node.renderedHeight() * axisFraction,
              id: node.id(), label: node.data('label'), shape: node.style('shape') }
          }, { type, zoom, axisFraction })
          assert.equal(target.shape, 'diamond')
          if (touch) {
            await page.touchscreen.touchStart(target.x, target.y)
            await new Promise(resolve => setTimeout(resolve, 80))
            await page.touchscreen.touchEnd()
          } else await page.mouse.click(target.x, target.y, { delay: 50 })
          await new Promise(resolve => setTimeout(resolve, 350))
          const taps = await page.evaluate(() => window.nodeTaps)
          assert.deepEqual(taps, [target.id], `${touch ? 'Touch' : 'Mouse'} ${type}, zoom ${zoom}, axis ${axisFraction}`)
          assert.ok(await page.$eval('#graph-mobile-details', (el, label) => el.innerText.includes(label), target.label))
        }
      }
    }
    assert.deepEqual(errors, [])
    console.log(`${touch ? 'Touch' : 'Mouse'}: both diamond types selectable along their center axis at 0.5×, 1×, and 2× zoom`)
    await page.close()
  }
} finally {
  await browser.close()
}
