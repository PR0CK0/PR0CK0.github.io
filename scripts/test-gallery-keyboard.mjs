import assert from 'node:assert/strict'
import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:5173'}/personal`, { waitUntil: 'networkidle0' })
  const thumbnails = 'button[aria-haspopup="dialog"]'
  assert.equal(await page.$$eval(thumbnails, buttons => buttons.length), 54)

  // Reach the gallery by actual Tab presses, without programmatic focus.
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(selector => document.activeElement.matches(selector), thumbnails)) break
  }
  const opener = await page.evaluate(() => document.activeElement.getAttribute('aria-label'))
  assert.ok(opener?.startsWith('Open '), 'Keyboard can reach a drawing')
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
  assert.notEqual(outline, 'none', 'Keyboard focus is visible')

  await page.keyboard.press('Enter')
  await page.waitForSelector('dialog[open]')
  assert.equal(await page.$eval('dialog', el => el.matches(':modal')), true)
  assert.equal(await page.$eval('dialog img', el => el.alt), opener.slice(5))
  for (const reverse of [false, true]) {
    if (reverse) await page.keyboard.down('Shift')
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab')
      assert.equal(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), true,
        'Focus stays inside the modal')
    }
    if (reverse) await page.keyboard.up('Shift')
  }
  await page.keyboard.press('Escape')
  await page.waitForSelector('dialog', { hidden: true })
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), opener)

  await page.keyboard.press('Tab')
  const secondOpener = await page.evaluate(() => document.activeElement.getAttribute('aria-label'))
  assert.ok(secondOpener?.startsWith('Open ') && secondOpener !== opener)
  await page.keyboard.press('Space')
  await page.waitForSelector('dialog[open]')
  assert.equal(await page.$eval('dialog img', el => el.alt), secondOpener.slice(5))
  await page.keyboard.press('Enter') // Focus starts on the close button.
  await page.waitForSelector('dialog', { hidden: true })
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), secondOpener)

  await page.click(thumbnails)
  await page.waitForSelector('dialog[open]')
  await page.click('dialog img')
  assert.ok(await page.$('dialog[open]'), 'Clicking the drawing keeps it open')
  await page.mouse.click(5, 5)
  await page.waitForSelector('dialog', { hidden: true })
  assert.equal(await page.evaluate(() => document.activeElement.matches('button[aria-haspopup="dialog"]')), true)

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.tap(thumbnails)
  await page.waitForSelector('dialog[open]')
  const bounds = await page.$eval('dialog img', el => {
    const rect = el.getBoundingClientRect()
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: innerWidth, height: innerHeight }
  })
  assert.ok(bounds.left >= 0 && bounds.top >= 0 && bounds.right <= bounds.width && bounds.bottom <= bounds.height)
  await page.tap('dialog button')
  await page.waitForSelector('dialog', { hidden: true })
  assert.deepEqual(errors, [])
  console.log('54 keyboard-accessible drawings; focus containment/restoration, Enter/Space/Escape, mouse closing, and mobile touch passed.')
} finally {
  await browser.close()
}
