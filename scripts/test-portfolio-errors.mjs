import assert from 'node:assert/strict'
import puppeteer from 'puppeteer'

const site = process.env.SITE_URL || 'http://127.0.0.1:5173'
const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setRequestInterception(true)
  let status = 503
  let intercept = true
  page.on('request', request => {
    if (intercept && new URL(request.url()).pathname === '/data/tyler-procko.yaml') {
      void request.respond({ status, contentType: 'text/yaml', body: 'id: person/test\nname: 123' })
    } else {
      void request.continue()
    }
  })

  await page.goto(`${site}/about`, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => document.body.innerText.includes('Failed to load portfolio data'), { timeout: 5000 })
  status = 200
  for (const route of ['/', '/about', '/graph', '/cv', '/resume']) {
    await page.goto(`${site}${route}`, { waitUntil: 'networkidle0' })
    await page.waitForFunction(() => document.body.innerText.includes('Portfolio data is invalid. Please try again later.'), { timeout: 5000 })
    console.log(`Validation error displayed on ${route}`)
  }

  intercept = false
  await page.goto(site, { waitUntil: 'networkidle0' })
  await page.waitForSelector('h1')
  assert.ok(!(await page.$eval('body', el => el.innerText)).includes('Portfolio data is invalid.'))
  assert.deepEqual(errors, [], 'No unhandled browser errors')
  console.log('Valid portfolio still renders')
} finally {
  await browser.close()
}
