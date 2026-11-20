import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import puppeteer from 'puppeteer'
import yaml from 'js-yaml'
import { projectRoutes } from './project-routes.mjs'

const site = process.env.SITE_URL || 'http://127.0.0.1:5173'
const person = yaml.load(readFileSync('public/data/tyler-procko.yaml', 'utf8'))
const routes = projectRoutes(person)
const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewport({ width: 1440, height: 1000 })
  await page.goto(`${site}/projects`, { waitUntil: 'networkidle0' })
  assert.equal(await page.$$eval('[data-project-card]', cards => cards.length), routes.length)
  await page.screenshot({ path: join(tmpdir(), 'portfolio-projects-desktop.png') })
  await page.type('input[type="search"]', 'no-such-project-xyz')
  await page.waitForFunction(() => document.querySelectorAll('[data-project-card]').length === 0)
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Clear filters').click())
  await page.waitForFunction(count => document.querySelectorAll('[data-project-card]').length === count, {}, routes.length)
  const domain = 'Cybersecurity'
  await page.select('select', domain)
  assert.ok(await page.$$eval('[data-project-card]', cards => cards.length) < routes.length)
  await page.select('select', '')

  for (const route of routes) {
    const project = person.projects.find(project => project.id === route.projectId)
    await page.goto(`${site}${route.path}`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(title => document.querySelector('h1')?.textContent === title, {}, project.title)
    await page.waitForFunction(path => document.querySelector('link[rel="canonical"]')?.href === `https://procko.pro${path}`, {}, route.path)
    if (project.description) assert.ok(await page.evaluate(text => document.body.textContent.includes(text), project.description))
    if (project.page?.image) {
      await page.waitForFunction(() => [...document.querySelectorAll('article img')].every(image => image.complete && image.naturalWidth > 0))
    }
  }
  console.log(`${routes.length} source-driven project pages render with correct titles, descriptions, and canonicals`)

  const detailed = routes.find(route => person.projects.find(project => project.id === route.projectId)?.page)
  await page.goto(`${site}${detailed.path}`, { waitUntil: 'networkidle0' })
  await page.screenshot({ path: join(tmpdir(), 'portfolio-project-detail-desktop.png') })
  await page.click(`a[href="/graph?term=${encodeURIComponent(detailed.projectId)}"]`)
  await page.waitForFunction(title => document.querySelector('[aria-label="Selected node details"]')?.textContent.includes(title),
    { timeout: 30_000 }, person.projects.find(project => project.id === detailed.projectId).title)
  for (const path of ['/projects', detailed.path]) {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(`${site}${path}`, { waitUntil: 'networkidle0' })
    assert.ok(await page.evaluate(() => document.querySelector('body > #root main').scrollWidth <= window.innerWidth), `${path}: no mobile horizontal overflow`)
    await page.screenshot({ path: join(tmpdir(), path === '/projects' ? 'portfolio-projects-mobile.png' : 'portfolio-project-detail-mobile.png') })
  }
  await page.goto(`${site}/projects/missing-project`, { waitUntil: 'networkidle0' })
  assert.equal(await page.$eval('h1', element => element.textContent), 'Project not found')
  assert.equal(await page.$eval('meta[name="robots"]', element => element.content), 'noindex, follow')
  const hidden = person.projects.find(project => project.graph_exclude)
  await page.goto(`${site}/projects/${hidden.id.split('/').slice(1).join('/')}`, { waitUntil: 'networkidle0' })
  assert.equal(await page.$eval('h1', element => element.textContent), 'Project not found')
  await page.goto(site, { waitUntil: 'networkidle0' })
  assert.equal(await page.$eval('nav', nav => Boolean(nav.querySelector('a[href="/projects"]'))), false)
  const allProjects = await page.evaluateHandle(() => [...document.querySelectorAll('a')].find(link => link.textContent.includes('View all projects')))
  await allProjects.asElement().click()
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Projects')
  assert.deepEqual(errors, [])
  console.log('Search, filtering, mobile layout, hidden/missing pages, and homepage navigation pass')
} finally {
  await browser.close()
}
