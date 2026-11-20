import { execFileSync } from 'node:child_process'
import { posix } from 'node:path'
import ts from 'typescript'
import yaml from 'js-yaml'

const COMPETENCY_FIELDS = ['education', 'work_experiences', 'publications', 'projects', 'courses', 'certificates', 'talks', 'extracurriculars']
const CV_FIELDS = [...COMPETENCY_FIELDS, 'social_links', 'location', 'phone', 'email_academic', 'awards', 'clearance', 'past_clearances', 'references']
const PROFILE_FIELDS = ['name', 'title', 'summary', 'website', 'email_personal', 'orcid', 'seo_description']
const DATA_FILE = 'public/data/tyler-procko.yaml'
const SHARED_FILES = ['index.html', 'src/main.tsx', 'src/App.tsx', 'src/index.css', 'tailwind.config.ts', 'package.json', 'package-lock.json', 'public/og-image.png', 'public/favicon.ico']
const SHARED_MODULES = ['src/components/Layout.tsx', 'scripts/profile-metadata.mjs']
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.mjs', '.json', '/index.ts', '/index.tsx']

// Sections are conservative: any edit within a consumed section counts.
// Imported local modules are followed automatically; runtime public assets are explicit.
export const PAGE_INPUTS = {
  '/': { entry: 'src/pages/Landing.tsx', fields: [...COMPETENCY_FIELDS, 'tagline', 'social_links'], assets: ['public/me.png'] },
  '/about': { entry: 'src/pages/About.tsx', fields: ['birth_year', 'mbti', 'hobbies', 'favorite_artists', 'favorite_music', 'favorite_books', 'favorite_show', 'awards', 'extracurriculars'] },
  '/graph': { entry: 'src/pages/Graph.tsx', fields: [...COMPETENCY_FIELDS, 'id', 'awards', 'associates'], assets: ['patches/'] },
  '/cv': { entry: 'src/pages/CVExport.tsx', fields: CV_FIELDS },
  '/resume': { entry: 'src/pages/ResumeExport.tsx', fields: CV_FIELDS },
  '/legacy': { entry: 'src/pages/Legacy.tsx', fields: null, assets: ['build.py', 'templates/', 'public/legacy/index.css', 'public/legacy/header.css', 'public/legacy/favicon.ico', 'public/legacy/icons/', 'public/legacy/certs/'] },
  '/personal': { entry: 'src/pages/Personal.tsx', fields: [], assets: ['public/art/'] },
}

function stableJSON(value) {
  return JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item)
}

export function resolvePageUpdates(root, routes = PAGE_INPUTS) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim()
  if (git('rev-parse', '--is-shallow-repository') === 'true') {
    throw new Error('Page update tracking requires full Git history (checkout fetch-depth: 0)')
  }
  const history = git('log', '--first-parent', '--format=%H %cI').split('\n').map(line => line.split(' '))
  const texts = new Map()
  const imports = new Map()
  const text = blob => {
    if (!texts.has(blob)) texts.set(blob, git('cat-file', '-p', blob))
    return texts.get(blob)
  }
  const snapshot = revision => {
    const tree = new Map(git('ls-tree', '-rz', revision).split('\0').filter(Boolean).map(line => {
      const [details, path] = line.split('\t')
      return [path, details.split(' ')[2]]
    }))
    const person = tree.has(DATA_FILE) ? yaml.load(text(tree.get(DATA_FILE))) : {}
    const work = person.work_experiences?.find(item => item.id === person.primary_work_experience)
    const profile = {
      ...Object.fromEntries(PROFILE_FIELDS.map(key => [key, person[key]])),
      social: person.social_links?.map(link => link.url),
      employer: work && { organization: work.organization, org_url: work.org_url },
    }
    return Object.fromEntries(Object.entries(routes).map(([path, rule]) => {
      if (!tree.has(rule.entry)) return [path, null]
      const files = new Set(SHARED_FILES.filter(file => tree.has(file)))
      const visit = file => {
        if (files.has(file) || !tree.has(file)) return
        files.add(file)
        if (!/\.[cm]?[jt]sx?$/.test(file)) return
        const blob = tree.get(file)
        if (!imports.has(blob)) imports.set(blob, ts.preProcessFile(text(blob), true, true).importedFiles.map(item => item.fileName))
        for (const specifier of imports.get(blob)) {
          const base = specifier.startsWith('@/') ? `src/${specifier.slice(2)}`
            : specifier.startsWith('.') ? posix.join(posix.dirname(file), specifier) : null
          if (!base) continue
          const dependency = EXTENSIONS.map(extension => base + extension).find(candidate => tree.has(candidate))
          if (dependency) visit(dependency)
        }
      }
      for (const file of [rule.entry, ...SHARED_MODULES]) visit(file)
      for (const asset of rule.assets ?? []) {
        for (const file of tree.keys()) if (asset.endsWith('/') ? file.startsWith(asset) : file === asset) files.add(file)
      }
      const data = rule.fields === null ? person : Object.fromEntries(rule.fields.map(key => [key, person[key]]))
      return [path, stableJSON({ files: Object.fromEntries([...files].sort().map(file => [file, tree.get(file)])), profile, data })]
    }))
  }

  let current = snapshot(history[0][0])
  const pending = new Set(Object.keys(routes))
  const updates = {}
  for (const path of pending) if (current[path] === null) throw new Error(`Missing page source for ${path}`)
  for (let index = 0; index < history.length && pending.size; index++) {
    const previous = index + 1 < history.length ? snapshot(history[index + 1][0]) : {}
    for (const path of pending) {
      if (current[path] !== previous[path]) {
        updates[path] = { modified: new Date(history[index][1]).toISOString(), commit: history[index][0] }
        pending.delete(path)
      }
    }
    current = previous
  }
  return updates
}

export function updateSitemap(xml, updates) {
  return xml.replace(/<url>[\s\S]*?<\/url>/g, entry => {
    const location = entry.match(/<loc>([^<]+)<\/loc>/)?.[1]
    const update = location && updates[new URL(location).pathname]
    if (!update) throw new Error(`Missing page tracking rule for ${location}`)
    const tag = `<lastmod>${update.modified}</lastmod>`
    return /<lastmod>/.test(entry) ? entry.replace(/<lastmod>[^<]*<\/lastmod>/, tag)
      : entry.replace('</loc>', `</loc>\n    ${tag}`)
  })
}
