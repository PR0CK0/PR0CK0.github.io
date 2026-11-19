import assert from 'node:assert/strict'
import puppeteer from 'puppeteer'

const site = process.env.SITE_URL || 'http://127.0.0.1:4173'
const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.setCacheEnabled(false)
  const errors = []
  const scripts = []
  const requests = new Set()
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => requests.add(new URL(request.url()).pathname))
  page.on('response', response => {
    if (new URL(response.url()).pathname.endsWith('.js')) scripts.push(response.buffer())
  })
  await page.goto(site, { waitUntil: 'networkidle0' })
  await page.waitForSelector('h1')
  const homeBytes = (await Promise.all(scripts)).reduce((sum, script) => sum + script.length, 0)
  assert.ok(homeBytes > 0, 'Homepage JavaScript was measured')
  assert.ok(homeBytes < 650_000, `Homepage JavaScript exceeds 650 kB: ${homeBytes}`)
  assert.ok(![...requests].some(path => /\/(Graph|CVExport|ResumeExport|Caladea|Carlito)[^/]*\.(js|ttf)$/.test(path)))
  console.log(`Homepage JavaScript: ${homeBytes} bytes; no graph or PDF modules/fonts requested`)

  await page.click('nav a[href="/graph"]')
  await page.waitForFunction(() => [...document.querySelectorAll('div')].some(el => el._cyreg?.cy?.nodes(':visible').length))
  assert.ok([...requests].some(path => /\/Graph-[^/]+\.js$/.test(path)))
  console.log('Graph loads through navigation')

  for (const route of ['/resume', '/cv']) {
    await page.click(`nav a[href="${route}"]`)
    await page.waitForFunction(path => document.querySelector('h1')?.textContent.includes(`${path}.pdf`), {}, route)
    await page.waitForFunction(() => {
      const link = document.querySelector('a[download][href^="blob:"]')
      return link && !link.querySelector('button')?.disabled
    }, { timeout: 120_000 })
    const pdf = await page.$eval('a[download][href^="blob:"]', async link => {
      const bytes = new Uint8Array(await (await fetch(link.href)).arrayBuffer())
      return { header: new TextDecoder().decode(bytes.slice(0, 5)), size: bytes.length, name: link.download }
    })
    assert.equal(pdf.header, '%PDF-')
    assert.ok(pdf.size > 1000)
    assert.ok(pdf.name.includes(route.slice(1)))
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'PDF').click())
    await page.waitForSelector('iframe[src^="blob:"]', { timeout: 120_000 })
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'HTML').click())
    await page.waitForFunction(() => !document.querySelector('iframe'))
    console.log(`${route}: valid ${pdf.size}-byte PDF and working PDF/HTML toggle`)
  }

  for (const route of ['/graph', '/resume', '/cv']) {
    const direct = await browser.newPage()
    direct.on('pageerror', error => errors.push(error.message))
    await direct.goto(`${site}${route}`, { waitUntil: 'networkidle0' })
    if (route === '/graph') {
      await direct.waitForFunction(() => [...document.querySelectorAll('div')].some(el => el._cyreg?.cy?.nodes(':visible').length))
    } else {
      await direct.waitForFunction(path => document.querySelector('h1')?.textContent.includes(`${path}.pdf`), {}, route)
    }
    await direct.close()
  }
  assert.deepEqual(errors, [], 'No unhandled browser errors')
  console.log('Direct links work for all three deferred routes')
} finally {
  await browser.close()
}
