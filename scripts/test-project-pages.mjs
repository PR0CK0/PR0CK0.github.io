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
  const previewProjects = person.projects.filter(project => !project.graph_exclude && project.repo_url).slice(0, 6)
  await page.setRequestInterception(true)
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.hostname === 'api.github.com' && /^\/users\/[^/]+\/repos$/.test(url.pathname)) {
      request.respond({ headers: { 'access-control-allow-origin': '*' }, contentType: 'application/json', body: JSON.stringify(previewProjects.map(project => ({
        name: project.repo_url.split('/').pop(), html_url: project.repo_url,
        created_at: '2026-01-01T00:00:00Z', pushed_at: '2026-02-01T00:00:00Z', stargazers_count: 0,
      }))) })
    } else request.continue()
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewport({ width: 1440, height: 1000 })
  await page.goto(`${site}/projects`, { waitUntil: 'networkidle0' })
  assert.equal(await page.$$eval('[data-project-card]', cards => cards.length), routes.length)
  assert.ok(await page.$$eval('[data-project-card]', cards => cards.every(card => card.textContent.includes('Project notes ↘'))))
  const visible = person.projects.filter(project => !project.graph_exclude)
  const cardTitles = () => page.$$eval('[data-project-card] h2', headings => headings.map(heading => heading.textContent))
  for (const order of ['newest', 'oldest', 'title-asc', 'title-desc']) {
    await page.select('select[name="sort"]', order)
    const sorted = [...visible].sort((a, b) => {
      const name = a.title.localeCompare(b.title)
      if (order.startsWith('title-')) return order === 'title-asc' ? name : -name
      return (order === 'newest' ? b.year.localeCompare(a.year) : a.year.localeCompare(b.year)) || name
    })
    assert.deepEqual(await cardTitles(), sorted.map(project => project.title))
  }
  await page.screenshot({ path: join(tmpdir(), 'portfolio-projects-desktop.png') })
  await page.type('input[type="search"]', 'no-such-project-xyz')
  await page.waitForFunction(() => document.querySelectorAll('[data-project-card]').length === 0)
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Clear filters').click())
  await page.waitForFunction(count => document.querySelectorAll('[data-project-card]').length === count, {}, routes.length)
  const domain = 'Cybersecurity'
  await page.select('select[name="domain"]', domain)
  assert.ok(await page.$$eval('[data-project-card]', cards => cards.length) < routes.length)
  const filteredTitles = await cardTitles()
  assert.deepEqual(filteredTitles, [...filteredTitles].sort((a, b) => b.localeCompare(a)))
  await page.select('select[name="domain"]', '')

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
  const previews = await page.evaluate(() => {
    const heading = [...document.querySelectorAll('h2')].find(heading => heading.textContent.includes('Recent Repos'))
    return [...heading.closest('section').querySelectorAll('h3 a')].map(link => ({ title: link.textContent, href: link.getAttribute('href') }))
  })
  assert.equal(previews.length, 6)
  assert.deepEqual(previews, previewProjects.map(project => ({ title: project.title, href: routes.find(route => route.projectId === project.id).path })))
  await page.click(`a[href="${previews[0].href}"]`)
  await page.waitForFunction(title => document.querySelector('h1')?.textContent === title, {}, previews[0].title)
  await page.goto(site, { waitUntil: 'networkidle0' })
  const allProjects = await page.evaluateHandle(() => [...document.querySelectorAll('a')].find(link => link.textContent.includes('View all projects')))
  await allProjects.asElement().click()
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Projects')
  assert.deepEqual(errors, [])
  console.log('Sorting, search, filtering, mobile layout, hidden/missing pages, and six homepage project links pass')
} finally {
  await browser.close()
}
