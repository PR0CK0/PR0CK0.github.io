import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import puppeteer from 'puppeteer'
import yaml from 'js-yaml'

const site = process.env.SITE_URL || 'http://127.0.0.1:5173'
const person = yaml.load(readFileSync('public/data/tyler-procko.yaml', 'utf8'))
const publications = person.publications.filter(publication => publication.status !== 'in_progress')
const scholar = person.social_links.find(link => link.platform === 'Google Scholar').url
const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewport({ width: 1440, height: 1000 })
  await page.goto(site, { waitUntil: 'networkidle0' })
  const buttons = await page.evaluate(() => {
    const link = [...document.querySelectorAll('a')].find(link => link.textContent.includes('View all publications'))
    return [...link.parentElement.querySelectorAll('a')].map(link => ({ text: link.textContent.trim(), href: link.getAttribute('href'), target: link.target }))
  })
  assert.deepEqual(buttons, [
    { text: 'View all publications →', href: '/papers', target: '' },
    { text: 'View on Google Scholar ↗', href: scholar, target: '_blank' },
  ])
  assert.equal(await page.$eval('nav', nav => Boolean(nav.querySelector('a[href="/papers"]'))), false)
  await page.click('a[href="/papers"]')
  await page.waitForFunction(count => document.querySelectorAll('[data-publication-card]').length === count, {}, publications.length)
  assert.equal(await page.$eval('link[rel="canonical"]', link => link.href), new URL('/papers', person.website).href)
  const cards = await page.$$eval('[data-publication-card]', cards => cards.map(card => card.textContent))
  for (const publication of publications) assert.ok(cards.some(text => text.includes(publication.title)))
  await page.screenshot({ path: join(tmpdir(), 'portfolio-publications-desktop.png') })
  await page.type('input[type="search"]', 'no-such-publication-xyz')
  await page.waitForFunction(() => document.querySelectorAll('[data-publication-card]').length === 0)
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Clear filters').click())
  const year = publications.find(publication => publication.date)?.date.slice(0, 4)
  await page.select('select[name="year"]', year)
  await page.select('select[name="status"]', 'published')
  assert.equal(await page.$$eval('[data-publication-card]', cards => cards.length), publications.filter(publication => publication.date?.startsWith(year) && publication.status === 'published').length)
  await page.select('select[name="year"]', '')
  await page.select('select[name="status"]', '')
  await page.select('select[name="sort"]', 'title-asc')
  const titles = await page.$$eval('[data-publication-card] h2', headings => headings.map(heading => heading.textContent.replace(/ ↗$/, '')))
  assert.deepEqual(titles, publications.map(publication => publication.title).sort((a, b) => a.localeCompare(b)))
  await page.goto(`${site}/papers`, { waitUntil: 'networkidle0' })
  assert.equal(await page.$$eval('[data-publication-card]', cards => cards.length), publications.length)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.waitForFunction(count => document.querySelectorAll('[data-publication-card]').length === count, {}, publications.length)
  assert.ok(await page.evaluate(() => document.querySelector('body > #root main').scrollWidth <= window.innerWidth), 'No mobile horizontal overflow')
  await page.screenshot({ path: join(tmpdir(), 'portfolio-publications-mobile.png') })
  assert.deepEqual(errors, [])
  console.log(`${publications.length} source publications, button ordering, Scholar destination, filtering, sorting, direct loading, and mobile layout pass`)
} finally {
  await browser.close()
}
