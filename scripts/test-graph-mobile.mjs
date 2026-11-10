import assert from 'node:assert/strict'
import puppeteer from 'puppeteer'

// Run against a running dev server, or set SITE_URL to the deployed site.
const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const touch = process.env.MOBILE_TOUCH === '1'
  await page.setViewport({ width: 390, height: 844, hasTouch: touch, isMobile: touch })
  await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:5173'}/graph`, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => [...document.querySelectorAll('div')].some(el => el._cyreg?.cy?.nodes(':visible').length))
  const assertControlsVisible = async () => {
    const bounds = await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find(el => el.textContent.includes('graph controls'))
      const rect = button.getBoundingClientRect()
      return { top: rect.top, bottom: rect.bottom, height: rect.height, viewport: innerHeight }
    })
    assert.ok(bounds.height > 0 && bounds.top >= 0 && bounds.bottom <= bounds.viewport,
      `Mobile controls must be inside the viewport: ${JSON.stringify(bounds)}`)
  }
  await assertControlsVisible()
  // Click the rendered canvas node, not a DOM click on a hidden control.
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(el => el.textContent.includes('graph controls') && el.textContent.includes('total:')))
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  // Allow Cytoscape's debounced viewport resize to settle before hit testing.
  await new Promise(resolve => setTimeout(resolve, 350))
  const target = await page.evaluate(async () => {
    const cy = [...document.querySelectorAll('div')].find(el => el._cyreg?.cy)._cyreg.cy
    const node = cy.nodes(':visible').filter(n => n.data('type') === 'person').first()
    await new Promise(resolve => {
      cy.one('render', resolve)
      cy.stop()
      cy.zoom(1)
      cy.center(node)
      cy.forceRender()
    })
    const point = node.renderedPosition()
    const box = cy.container().getBoundingClientRect()
    // Stay inside the diamond, away from Cytoscape's exact polygon-axis hit-test ambiguity.
    return { x: box.left + point.x + 4, y: box.top + point.y, label: node.data('label') }
  })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  if (touch) {
    await page.touchscreen.touchStart(target.x, target.y)
    await new Promise(resolve => setTimeout(resolve, 80))
    await page.touchscreen.touchEnd()
  } else await page.mouse.click(target.x, target.y, { delay: 50 })
  await page.waitForFunction(label => {
    const panel = document.querySelector('#graph-mobile-details')
    return panel?.clientHeight > 0 && panel.innerText.includes(label)
  }, {}, target.label)
  await page.waitForFunction(() => document.querySelector('#graph-mobile-panel').getAnimations().length === 0)
  await assertControlsVisible()
  const details = await page.evaluate(() => {
    const drawer = document.querySelector('#graph-mobile-details')
    const selected = drawer.querySelector('[aria-label="Selected node details"]')
    const rect = selected.getBoundingClientRect()
    return { top: rect.top, drawerTop: drawer.getBoundingClientRect().top, scrollable: drawer.scrollHeight > drawer.clientHeight,
      connections: selected.querySelectorAll('button').length }
  })
  assert.ok(Math.abs(details.top - details.drawerTop) < 2, 'Selection must appear at the top of the mobile drawer')
  assert.ok(details.scrollable && details.connections > 0, 'Connections must be available in the scrollable drawer')
  const drawer = '#graph-mobile-details'
  const connections = `${drawer} [aria-label="Connected nodes"] > button`
  assert.equal(await page.$$eval(connections, buttons => buttons.length), 5, 'Show only five connections initially')
  assert.ok(await page.$eval(connections, button => button.getBoundingClientRect().height < 30), 'Single-line connections should stay compact')
  assert.equal(await page.$eval(drawer, el => el.scrollWidth <= el.clientWidth), true, 'Details must not overflow sideways')
  if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: `${process.env.SCREENSHOT_PATH}.connections.png` })
  const expand = `${drawer} [aria-label="Expand connected nodes"]`
  await page.click(expand)
  assert.ok(await page.$$eval(connections, buttons => buttons.length > 5), 'Expansion reveals remaining connections')
  await page.$eval(drawer, el => { el.scrollTop = 0 })
  await page.waitForSelector('[aria-label="Scroll details down"]', { visible: true })
  await page.click('[aria-label="Scroll details down"]')
  await page.waitForFunction(() => document.querySelector('#graph-mobile-details').scrollTop > 0)
  await page.$eval(drawer, el => { el.scrollTop = el.scrollHeight })
  await page.waitForSelector('[aria-label="Scroll details down"]', { hidden: true })
  await page.click(`${drawer} [aria-label="Collapse connected nodes"]`)
  assert.equal(await page.$$eval(connections, buttons => buttons.length), 5)
  await page.$eval(drawer, el => { el.scrollTop = el.scrollHeight })
  const filter = `${drawer} [aria-label="Graph node type filters"]`
  await page.click(`${drawer} [aria-label="Scroll filters right"]`)
  await page.waitForFunction(selector => document.querySelector(selector).scrollLeft > 0, {}, filter)
  await page.click(`${drawer} [aria-label="Scroll filters left"]`)
  await page.waitForFunction(selector => document.querySelector(selector).scrollLeft < 2, {}, filter)
  if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: `${process.env.SCREENSHOT_PATH}.filters.png` })
  await page.$eval(drawer, el => { el.scrollTop = 0 })
  // Let the first touch gesture finish before tapping a newly opened control.
  if (touch) await new Promise(resolve => setTimeout(resolve, 350))
  const connection = `${connections}:first-child`
  if (touch) await page.tap(connection)
  else await page.click(connection)
  await page.waitForFunction(label => {
    const selected = document.querySelector('#graph-mobile-details [aria-label="Selected node details"]')
    const heading = selected?.querySelector('.font-bold.leading-snug')?.textContent
    return heading && heading !== label
  }, {}, target.label)
  assert.ok(await page.$$eval(connections, buttons => buttons.length <= 5), 'Selecting another node resets the connection preview')
  assert.equal(await page.$(`${drawer} [aria-label="Collapse connected nodes"]`), null)
  if (touch) await new Promise(resolve => setTimeout(resolve, 350))
  const toggle = '[aria-controls="graph-mobile-details"]'
  if (touch) await page.tap(toggle)
  else await page.click(toggle)
  await page.waitForFunction(() => document.querySelector('[aria-controls="graph-mobile-details"]').getAttribute('aria-expanded') === 'false')
  await page.waitForFunction(() => document.querySelector('#graph-mobile-panel').getAnimations().length === 0)
  await assertControlsVisible()
  for (const size of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 375, height: 667 }, { width: 600, height: 400 }]) {
    await page.setViewport({ ...size, hasTouch: touch, isMobile: touch })
    if (size.width < 640) await assertControlsVisible()
  }
  await page.setViewport({ width: 390, height: 844, hasTouch: touch, isMobile: touch })
  await page.click(toggle)
  await page.evaluate(() => document.documentElement.classList.add('light'))
  assert.equal(await page.$eval(drawer, el => el.scrollWidth <= el.clientWidth), true)
  if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: `${process.env.SCREENSHOT_PATH}.light.png` })
  for (const size of [{width:320,height:568}, {width:600,height:400}]) {
    await page.setViewport({ ...size, hasTouch: touch, isMobile: touch })
    await assertControlsVisible()
    assert.equal(await page.$eval(drawer, el => el.scrollWidth <= el.clientWidth), true, 'No sideways overflow on small screens')
  }
  assert.deepEqual(errors, [])
  console.log('PASS mobile bounds, vertical-only details, five-connection disclosure, scroll cues, filter arrows, selection and navigation')
} finally {
  await browser.close()
}
