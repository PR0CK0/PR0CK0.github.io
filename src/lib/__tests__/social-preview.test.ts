import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

it('serves the shared preview PNG with dimensions matching its metadata', () => {
  const html = readFileSync('index.html', 'utf8')
  const imageUrl = html.match(/property="og:image" content="([^"]+)"/)?.[1]
  expect(imageUrl).toBeTruthy()
  expect(html.match(/name="twitter:image" content="([^"]+)"/)?.[1]).toBe(imageUrl)
  const url = new URL(imageUrl!)
  expect(url.protocol).toBe('https:')
  const image = readFileSync(join('public', url.pathname.slice(1)))
  expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(image.readUInt32BE(16)).toBe(Number(html.match(/property="og:image:width" content="(\d+)"/)?.[1]))
  expect(image.readUInt32BE(20)).toBe(Number(html.match(/property="og:image:height" content="(\d+)"/)?.[1]))
})
