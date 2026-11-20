import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import puppeteer from 'puppeteer'
import yaml from 'js-yaml'
import { resolvePageUpdates } from './page-updates.mjs'

const site = process.env.SITE_URL || 'http://127.0.0.1:4173'
const person = yaml.load(readFileSync('public/data/tyler-procko.yaml', 'utf8'))
const routes = [...readFileSync('src/App.tsx', 'utf8').matchAll(/<Route\s+path="(\/[^"]*)"/g)].map(match => match[1])
const updates = resolvePageUpdates(process.cwd())
const browser = await puppeteer.launch({ headless: true })

async function checkMetadata(page, path) {
  const metadata = await page.evaluate(() => {
    const values = selector => [...document.head.querySelectorAll(selector)].map(el => el.getAttribute('content') ?? el.getAttribute('href') ?? el.textContent)
    return {
      title: values('title'),
      canonical: values('link[rel="canonical"]'),
      description: values('meta[name="description"]'),
      ogTitle: values('meta[property="og:title"]'),
      ogDescription: values('meta[property="og:description"]'),
      ogUrl: values('meta[property="og:url"]'),
      twitterTitle: values('meta[name="twitter:title"]'),
      twitterDescription: values('meta[name="twitter:description"]'),
      ogImage: values('meta[property="og:image"]'),
      twitterImage: values('meta[name="twitter:image"]'),
    }
  })
  for (const [key, values] of Object.entries(metadata)) {
    assert.equal(values.length, 1, `${path}: exactly one ${key}`)
    assert.ok(values[0].trim(), `${path}: nonempty ${key}`)
  }
  assert.deepEqual(metadata.canonical, [new URL(path, person.website).href])
  assert.deepEqual(metadata.ogUrl, metadata.canonical)
  assert.deepEqual(metadata.ogTitle, metadata.title)
  assert.deepEqual(metadata.twitterTitle, metadata.title)
  assert.deepEqual(metadata.ogDescription, metadata.description)
  assert.deepEqual(metadata.twitterDescription, metadata.description)
  assert.deepEqual(metadata.twitterImage, metadata.ogImage)
  if (path === '/') {
    assert.deepEqual(metadata.title, [[person.name, person.title?.split(' — ')[0]].filter(Boolean).join(' — ')])
    assert.ok(metadata.description[0].startsWith(person.seo_description || person.summary))
  }
  const profileModified = await page.$eval('script[type="application/ld+json"]', script =>
    JSON.parse(script.textContent)['@graph'].find(item => item['@type'] === 'ProfilePage').dateModified)
  assert.equal(profileModified, updates['/'].modified, `${path}: homepage profile uses its source update date`)
  return metadata
}

try {
  const response = await fetch(`${site}/sitemap.xml`)
  assert.equal(response.status, 200)
  const entries = [...(await response.text()).matchAll(/<url>([\s\S]*?)<\/url>/g)]
  const sitemapPaths = []
  for (const [, entry] of entries) {
    const path = new URL(entry.match(/<loc>([^<]+)<\/loc>/)[1]).pathname
    sitemapPaths.push(path)
    assert.equal(entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1], updates[path]?.modified, `${path}: historical sitemap date`)
  }
  assert.deepEqual(sitemapPaths.sort(), [...routes].sort())
  console.log('Sitemap dates match source history for every route')
  // Disable page scripts to inspect the HTML that crawlers receive before React runs.
  const raw = await browser.newPage()
  await raw.setJavaScriptEnabled(false)
  const snapshots = new Map()
  for (const path of routes) {
    // The trailing slash serves the generated directory index in Vite preview.
    const response = await raw.goto(`${site}${path === '/' ? path : `${path}/`}`, { waitUntil: 'domcontentloaded' })
    assert.equal(response.status(), 200, `${path}: successful response`)
    snapshots.set(path, await checkMetadata(raw, path))
    console.log(`${path}: delivered HTML metadata passes`)
  }
  await raw.close()

  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(site, { waitUntil: 'networkidle0' })
  for (const path of ['/graph', '/cv', '/resume', '/']) {
    await page.click(`nav a[href="${path}"]`)
    await page.waitForFunction(url => document.querySelector('link[rel="canonical"]')?.href === url, {}, new URL(path, person.website).href)
    assert.deepEqual(await checkMetadata(page, path), snapshots.get(path), `${path}: navigation matches delivered HTML`)
    console.log(`${path}: client navigation metadata passes`)
  }
  assert.deepEqual(errors, [], 'No unhandled browser errors')
} finally {
  await browser.close()
}
