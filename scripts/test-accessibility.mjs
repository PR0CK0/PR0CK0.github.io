import assert from 'node:assert/strict'
import { test } from 'node:test'
import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: true })
const site = process.env.SITE_URL || 'http://127.0.0.1:5173'
async function openPage(route, theme, mobile = false) {
  const page = await browser.newPage()
  await page.setViewport({ width: mobile ? 390 : 1280, height: 900 })
  await page.evaluateOnNewDocument(value => localStorage.setItem('theme', value), theme)
  await page.goto(`${site}${route}`, { waitUntil: 'networkidle0' })
  if (route === '/graph') {
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(el => el.textContent.includes('graph controls') && el.textContent.includes('total:')))
    if (mobile) {
      await page.focus('[aria-controls="graph-mobile-details"]')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.querySelector('#graph-mobile-details').clientHeight > 0)
    }
  } else await page.waitForFunction(() => [...document.querySelectorAll('button')].some(el => el.textContent.includes('by category')))
  return page
}
try {
  for (const theme of ['dark', 'light']) {
    await test(`${theme}: navigation text contrast`, async () => {
      const page = await openPage('/', theme)
      try {
        const ratios = await page.evaluate(() => {
          const rgb = s => s.match(/[\d.]+/g).slice(0, 3).map(Number)
          const luminance = c => c.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((n, v, i) => n + v * [.2126, .7152, .0722][i], 0)
          return [...document.querySelectorAll('nav a')].map(el => {
            let parent = el
            while (getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') parent = parent.parentElement
            const a = luminance(rgb(getComputedStyle(el).color)), b = luminance(rgb(getComputedStyle(parent).backgroundColor))
            return { text: el.textContent, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }
          })
        })
        for (const entry of ratios) assert.ok(entry.ratio >= 4.5, `${entry.text}: ${entry.ratio.toFixed(2)}:1`)
      } finally { await page.close() }
    })
    await test(`${theme}: skill chips accept keyboard navigation`, async () => {
      const page = await openPage('/', theme)
      try {
        await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.includes('by category')).focus())
        await page.keyboard.press('Tab')
        const chip = await page.evaluate(() => {
          const el = document.activeElement, style = getComputedStyle(el)
          return { tag: el.tagName, href: el.getAttribute('href'), outline: style.outlineStyle, width: parseFloat(style.outlineWidth) }
        })
        assert.equal(chip.tag, 'A')
        assert.ok(chip.href.startsWith('/graph?term='))
        assert.notEqual(chip.outline, 'none')
        assert.ok(chip.width >= 2)
        await page.keyboard.press('Enter')
        await page.waitForFunction(() => location.pathname === '/graph')
        assert.ok(page.url().endsWith(chip.href))
      } finally { await page.close() }
    })
    for (const mobile of [false, true]) {
      await test(`${theme}, ${mobile ? 'mobile' : 'desktop'}: graph filters show keyboard focus`, async () => {
        const page = await openPage('/graph', theme, mobile)
        try {
          await page.keyboard.press('Tab')
          await page.evaluate(() => [...document.querySelectorAll('input[type=checkbox]')].find(el => el.getClientRects().length && !el.closest('[inert]')).focus())
          const state = await page.evaluate(() => {
            const el = document.activeElement, label = el.closest('label'), style = getComputedStyle(label)
            return { checked: el.checked, outline: style.outlineStyle, width: parseFloat(style.outlineWidth) }
          })
          assert.notEqual(state.outline, 'none')
          assert.ok(state.width >= 2)
          await page.keyboard.press('Space')
          assert.equal(await page.evaluate(() => document.activeElement.checked), !state.checked)
        } finally { await page.close() }
      })
      await test(`${theme}, ${mobile ? 'mobile' : 'desktop'}: search selects hidden nodes and handles no matches`, async () => {
        const page = await openPage('/graph', theme, mobile)
        try {
          const target = await page.evaluate(() => {
            const cy = [...document.querySelectorAll('div')].find(el => el._cyreg?.cy)._cyreg.cy
            const node = cy.nodes().filter(n => !n.visible()).first()
            return { id: node.id(), label: node.data('label') }
          })
          await page.evaluate(() => [...document.querySelectorAll('input[type=text]')].find(el => el.getClientRects().length && !el.closest('[inert]')).focus())
          assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Search graph nodes')
          await page.keyboard.type(target.label)
          await page.waitForFunction(id => [...document.querySelectorAll('[data-search-result]')].some(el => el.dataset.searchResult === id), {}, target.id)
          await page.keyboard.press('ArrowDown')
          assert.ok(await page.evaluate(() => document.activeElement.hasAttribute('data-search-result')))
          const first = await page.evaluate(() => document.activeElement.dataset.searchResult)
          await page.keyboard.press('Enter')
          await page.waitForFunction(id => {
            const cy = [...document.querySelectorAll('div')].find(el => el._cyreg?.cy)._cyreg.cy
            return cy.getElementById(id).visible() && [...document.querySelectorAll('[aria-label="Selected node details"]')].some(el => el.innerText.includes(cy.getElementById(id).data('label')))
          }, {}, first)
          await page.keyboard.press('Escape')
          assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Search graph nodes')
          await page.keyboard.type('no-matching-node-zzzz')
          await page.waitForFunction(() => [...document.querySelectorAll('[role=status]')].some(el => el.textContent.includes('No matching nodes')))
          await page.keyboard.press('Escape')
          assert.equal(await page.evaluate(() => document.activeElement.value), '')
        } finally { await page.close() }
      })
    }
  }
} finally { await browser.close() }
