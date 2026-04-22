/**
 * Prerender script — generates static HTML snapshots for each route.
 *
 * Starts a Vite preview server against the built dist/, then visits each
 * route with Puppeteer and writes the rendered HTML to the appropriate
 * output path. This lets search crawlers see real content instead of an
 * empty <div id="root">.
 *
 * Usage: node scripts/prerender.mjs
 * Run after: npm run build
 */

import puppeteer from 'puppeteer'
import { preview } from 'vite'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const PORT = 4173

// route path → output subdirectory inside dist/ ('' = root index.html)
const ROUTES = [
  { path: '/',       dir: ''       },
  { path: '/about',  dir: 'about'  },
  { path: '/graph',  dir: 'graph'  },
  { path: '/cv',     dir: 'cv'     },
  { path: '/resume', dir: 'resume' },
  { path: '/legacy', dir: 'legacy' },
]

// ms to wait after window.load for React + YAML to finish rendering
const SETTLE_MS = 3000

async function main() {
  console.log('Starting Vite preview server...')
  const server = await preview({
    root: ROOT,
    preview: { port: PORT, strictPort: true, host: 'localhost' },
  })

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    for (const { path, dir } of ROUTES) {
      const url = `http://localhost:${PORT}${path}`
      process.stdout.write(`  Rendering ${path} ... `)

      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'load', timeout: 30_000 })
      // give React + YAML fetch time to settle
      await new Promise(r => setTimeout(r, SETTLE_MS))

      const html = await page.content()
      await page.close()

      if (dir) {
        const outDir = join(DIST, dir)
        mkdirSync(outDir, { recursive: true })
        writeFileSync(join(outDir, 'index.html'), html, 'utf-8')
      } else {
        writeFileSync(join(DIST, 'index.html'), html, 'utf-8')
      }

      console.log('✓')
    }
  } finally {
    await browser.close()
    server.httpServer.close()
  }

  console.log(`\nPrerendered ${ROUTES.length} routes into dist/.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
