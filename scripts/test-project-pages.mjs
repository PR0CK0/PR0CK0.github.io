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
  let repositoryFeedAvailable = true
  await page.setRequestInterception(true)
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.hostname === 'api.github.com' && /^\/users\/[^/]+\/repos$/.test(url.pathname)) {
      request.respond({ status: repositoryFeedAvailable ? 200 : 403, headers: { 'access-control-allow-origin': '*' }, contentType: 'application/json', body: repositoryFeedAvailable ? JSON.stringify(previewProjects.map(project => ({
        id: project.github_repo_id, name: 'renamed-preview',
        html_url: project.github_repo_id ? `https://github.com/example/renamed-${project.github_repo_id}` : project.repo_url,
        created_at: '2026-01-01T00:00:00Z', pushed_at: '2026-02-01T00:00:00Z', stargazers_count: 0,
      }))) : JSON.stringify({ message: 'API rate limit exceeded' }) })
    } else request.continue()
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewport({ width: 1440, height: 1000 })
  await page.goto(`${site}/projects`, { waitUntil: 'networkidle0' })
  assert.equal(await page.$$eval('[data-project-card]', cards => cards.length), routes.length)
  assert.ok(await page.$$eval('[data-project-card]', cards => cards.every(card => !card.textContent.includes('Project notes'))))
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

  assert.equal(await page.$$eval('[data-project-card] a', links => links.some(link => /^\/projects\/[^#]/.test(link.getAttribute('href')))), false)
  for (const project of visible) {
    const route = routes.find(route => route.projectId === project.id)
    const card = await page.$(`[id="${route.target.split('#')[1]}"]`)
    assert.ok(card, project.title)
    if (project.description) assert.ok(await card.evaluate((element, description) => element.textContent.includes(description), project.description))
    for (const section of project.page?.sections ?? []) {
      for (const paragraph of section.paragraphs) assert.ok(await card.evaluate((element, text) => element.textContent.includes(text), paragraph))
    }
  }
  const summary = await page.$('[data-project-card] details')
  assert.equal(await summary.evaluate(element => element.open), false)
  await summary.$eval('summary', element => element.click())
  assert.equal(await summary.evaluate(element => element.open), true)
  await summary.$eval('summary', element => element.click())
  assert.equal(await summary.evaluate(element => element.open), false)
  console.log(`${routes.length} projects share one page; source summaries expand and collapse`)

  const detailed = routes.find(route => person.projects.find(project => project.id === route.projectId)?.page)
  await page.goto(`${site}${detailed.target}`, { waitUntil: 'networkidle0' })
  const anchor = detailed.target.split('#')[1]
  assert.equal(await page.$eval(`[id="${anchor}"] details`, element => element.open), true)
  await page.click(`[id="${anchor}"] a[href="/graph?term=${encodeURIComponent(detailed.projectId)}"]`)
  await page.waitForFunction(title => document.querySelector('[aria-label="Selected node details"]')?.textContent.includes(title),
    { timeout: 30_000 }, person.projects.find(project => project.id === detailed.projectId).title)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.goto(`${site}/projects`, { waitUntil: 'networkidle0' })
  await page.$$eval('[data-project-card] details', elements => elements.forEach(element => { element.open = true }))
  assert.ok(await page.evaluate(() => document.querySelector('body > #root main').scrollWidth <= window.innerWidth), 'No mobile horizontal overflow with expanded summaries')
  await page.screenshot({ path: join(tmpdir(), 'portfolio-projects-mobile.png') })
  for (const path of [detailed.path, '/projects/missing-project']) {
    await page.goto(`${site}${path}`, { waitUntil: 'networkidle0' })
    await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Projects')
    assert.equal(await page.$eval('link[rel="canonical"]', element => element.href), new URL('/projects', person.website).href)
  }
  await page.goto(site, { waitUntil: 'networkidle0' })
  assert.equal(await page.$eval('nav', nav => Boolean(nav.querySelector('a[href="/projects"]'))), false)
  const previews = await page.evaluate(() => {
    const heading = [...document.querySelectorAll('h2')].find(heading => heading.textContent.includes('Recent Repos'))
    return [...heading.closest('section').querySelectorAll('h3 a')].map(link => ({ title: link.textContent, href: link.getAttribute('href') }))
  })
  assert.equal(previews.length, 6)
  assert.deepEqual(previews, previewProjects.map(project => ({ title: project.title, href: routes.find(route => route.projectId === project.id).target })))
  await page.click(`a[href="${previews[0].href}"]`)
  await page.waitForFunction(id => document.getElementById(id)?.querySelector('details')?.open, {}, previews[0].href.split('#')[1])
  assert.equal(await page.$eval('h1', element => element.textContent), 'Projects')
  await page.goto(site, { waitUntil: 'networkidle0' })
  const allProjects = await page.evaluateHandle(() => [...document.querySelectorAll('a')].find(link => link.textContent.includes('View all projects')))
  await allProjects.asElement().click()
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Projects')
  repositoryFeedAvailable = false
  await page.goto(site, { waitUntil: 'networkidle0' })
  const fallback = await page.evaluate(() => {
    const section = [...document.querySelectorAll('h2')].find(heading => heading.textContent.includes('Recent Repos')).closest('section')
    return { titles: [...section.querySelectorAll('h3 a')].map(link => link.textContent), text: section.textContent }
  })
  assert.deepEqual(fallback.titles, previewProjects.map(project => project.title))
  assert.ok(fallback.text.includes('project date'))
  assert.ok(!fallback.text.includes('created '), 'Fallback must not invent GitHub creation dates')
  assert.deepEqual(errors, [])
  console.log('Sorting, search, filtering, mobile layout, retired routes, six homepage summary links, and GitHub rate-limit fallback pass')
} finally {
  await browser.close()
}
