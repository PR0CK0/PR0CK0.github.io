# TODO

## Full manual audit — legacy view + PDF review pass

Comprehensive 1-by-1 audit of every publication and project. Upload each PDF/repo to Claude, extract all technologies, domains, and soft skills that are missing. Cross-reference with the legacy CV HTML view to catch anything the YAML doesn't cover.

- [ ] Walk through legacy view (`/legacy`) entry by entry, compare against YAML for completeness
- [ ] For each publication: upload the PDF, grep for tools/languages/frameworks/ontologies/datasets, update YAML
- [ ] For each project: clone or browse the repo, identify all technologies used, update YAML
- [ ] Verify no entries are missing from the YAML that appear in the legacy view
- [ ] Reconcile any discrepancies between legacy CV content and YAML data

## Publications — add technologies (needs PDF review)

Domains are done for all 40 pubs. Technologies still need a PDF review pass.
All pubs already have `Microsoft Word` and `Microsoft Teams`. Grab the PDFs,
feed to Claude, and populate `technologies` in the YAML.

Use scripts/update_pubs_batchN.py pattern to apply changes.

- [x] pub/explainable-ml-semantic-web
- [x] pub/interpersonal-chemistry-agile
- [x] pub/swebok-kg-transformer
- [x] pub/microelectronic-ai-dishonesty
- [x] pub/auto-bfo-aristotelian-definitions
- [x] pub/towards-agile-academia
- [x] pub/prov-o-bfo-mapping
- [x] pub/graph-rag-survey
- [x] pub/ml-lifecycle-provenance-survey
- [x] pub/linked-data-aerospace
- [x] pub/ontology-sdlc-aerospace
- [x] pub/robust-training-datasets-ontologies
- [x] pub/semantic-science-beyond-pdf
- [x] pub/dawn-of-dialogue
- [x] pub/lm-kg-survey
- [ ] pub/scrum-in-classroom
- [ ] pub/gps-signal-strength
- [x] pub/auto-code-documentation
- [x] pub/gpt4-stochastic-parrot
- [ ] pub/catastrophic-forgetting
- [ ] pub/digital-rubber-duck
- [ ] pub/validating-security-requirements-kg
- [ ] pub/secure-development-ontology
- [ ] pub/vr-software-requirements
- [ ] pub/ml-misbehaviors-taxonomy
- [x] pub/kg-geospatial-sumo (skip — idea only)
- [x] pub/sdlc-ontology-engineering (skip — idea only)
- [ ] pub/cognitive-assistants-aviation-inprogress
- [x] pub/colleague-thesis-vonderhaar (skip)
- [x] pub/colleague-thesis-kiselev (skip)
- [x] pub/competition-proposal-nas (skip)
- [x] pub/grant-proposal-nsf (skip)
- [ ] pub/article-synthetic-ontologies

## Publications — citation count display

- [ ] **Show total citation count on CV/Resume** — OpenAlex per-paper `cited_by_count` is already stored in YAML and updated weekly, but the aggregate is ~4× lower than Google Scholar (OpenAlex: ~61, Google Scholar: 238). Options: (a) add a `total_citations` field to the person object in YAML that you manually bump periodically; (b) find an API with Scholar-level coverage (Semantic Scholar may be better). For now, citation count is hidden from the display.

## CV / Resume — typography normalization

- [x] **Normalize CV and Resume header fonts and sizes** — Extracted into `src/lib/pdf-constants.ts` (`FS`, `COLOR`, `px`). Both CVExport and ResumeExport now reference shared tokens; no bare hex or numeric size literals remain in either file.

## Legacy index.html — full port audit

- [ ] **Ensure legacy view is fully ported to YAML/React** — Walk through `/legacy` (the old static CV HTML at `public/legacy/index.html`) entry by entry and verify every section, entry, bullet point, and nuance is captured in `public/data/tyler-procko.yaml`. The legacy view was the source of truth before the YAML migration; anything present there but absent from the YAML is a data loss.

## Skill category labels — Landing and Schema normalization

- [x] **Normalize skill category headings between Landing page and schema** — The `SkillSchema` `category` enum uses snake_case keys (e.g. `prog_languages`, `ai_tools`, `soft_skills`) while the Landing page renders human-readable labels (e.g. "Programming Languages", "AI Tools"). These mappings live in separate places and can drift. Consolidate into a single `SKILL_CATEGORY_LABELS` constant shared between the schema/graph and the Landing render so adding a new category only requires one change.

## Light Mode

- [x] **Light mode on Graph, CV, Resume pages** — Graph.tsx uses hundreds of hardcoded hex colors in inline styles and Cytoscape stylesheet; CV/Resume use hardcoded print colors. All need migrating to Tailwind CSS variable classes (`bg-terminal-bg` etc.) to respect `html.light`. About and Landing already work correctly.

## Graph

- [ ] Graph: clicking a skill chip navigates to the graph with `?q=<skill>` and the node is found/searched, but neighborhood dimming doesn't apply until you manually re-click the node. `layoutstop` approach attempted — Cytoscape class application timing is tricky here.
- [ ] **Graph filter scroll shadows** — Add visual indicator on mobile when filter-by-type list is scrollable. Should show fade/shadow on edges only when content exists to scroll in that direction. Several attempts didn't work reliably; needs a different approach or library.

## Ensure full coverage of domains, technologies, soft_skills on all entries

Every work_experience, publication, project, extracurricular, talk, and course entry
should have at minimum: technologies, domains. Soft skills where applicable.

- [ ] work_experiences — audit all entries for missing domains (afrl-2019 through afrl-2023, upwork entries, etc.)
- [ ] publications — technologies still need PDF review pass (see section above)
- [ ] projects — 16 deferred projects still need domains/techs (see section below)
- [ ] extracurriculars — verify all 26 entries have appropriate coverage
- [ ] courses — add technologies/domains to course entries
- [ ] talks — verify domains/technologies populated

## SEO & Discoverability

- [ ] **Create OG image** — 1200x630px PNG at `public/og-image.png`. Name + title + terminal aesthetic. Without this, every LinkedIn/Slack/Discord share shows no preview image.
- [ ] **Google Search Console** — verify procko.pro, submit sitemap.xml, request indexing.
- [ ] **Bing Webmaster Tools** — import from Google Search Console (covers Bing + DuckDuckGo + Yahoo).
- [ ] **Prerendering** — revisit with `vite-react-ssg` or custom Puppeteer build script. Social/AI crawlers still see empty `<div id="root">`.
- [ ] **ScholarlyArticle JSON-LD** — add structured data for top publications to improve Google Scholar and search visibility.
- [ ] **Backlinks audit** — ensure procko.pro is linked from: LinkedIn website field, Google Scholar profile, ORCID, Substack about page, SSRN author page, ERAU directory if possible.
- [ ] **Blog/content section** — Google ranks pages with text content. Pull Substack RSS or add articles section for more indexable pages.
- [ ] **Update GitHub bio** — "AI engineer bridging ontologies and LLMs — knowledge graphs, agentic RAG, provenance. PhD. DoD-cleared."
- [ ] **Pin best GitHub repos** — PR0CK0.github.io, ProvTracer, awesome-bfo, StableDiffusionEndToEndGuide, dissenter, ai-landscape-digest.
- [ ] **Star ecosystem repos** — star BFO, Protégé, cytoscape, etc. to signal your ecosystem to profile visitors.

## YAML purity — no HTML or styling in source data

- [x] **Strip all HTML/styling artifacts from `tyler-procko.yaml`** — Phase 1 done: removed tags (74), description duplicates in work/projects (57), close_span_before_end_link (1), primary_author_position (14), after_span_text (2), after_link_text (1), org_extra_after_italic (1). Remaining: date_display, title_line, org — need Jinja2 template updates first. — The YAML is a pure data file; presentation logic belongs in the React components. Known offenders include fields like `close_span_before_end_link`, `primary_author_position: in_span`, `after_span_text`, `after_link_text`, `org_extra_after_italic`, and any raw `<i>`, `<a>`, or similar HTML tags embedded in string values. Each of these is a legacy holdover from the old Jinja2/HTML build. Audit every field, remove the HTML-aware fields, and implement equivalent presentation logic in the components that render those entries.

## Web dev best practices audit

- [ ] **Research and apply web dev best practices** — As the site grows, audit against standard production patterns: code splitting and lazy loading (are all pages lazy-loaded via React.lazy?), bundle size analysis (`vite build --report`), image optimization, caching headers on GitHub Pages, accessibility (a11y — semantic HTML, ARIA labels, keyboard nav, color contrast), Core Web Vitals (LCP, CLS, FID), and scalability of the single YAML fetch (consider splitting into section-level files if the YAML grows large). Also review whether the runtime YAML fetch should be replaced with build-time static generation as content volume increases.

## Potential / Future

- [ ] **LinkML schema migration** — Replace `schema.ts` (Zod) with a LinkML schema (`schema.yaml`). Data YAML stays identical. Gains: build-time `linkml-validate`, `gen-owl` produces an OWL ontology of the CV (cool talking point), `gen-python` for typed Python models, `gen-json-schema` for JSON Schema validation. Cost: Python codegen step added to build pipeline, no official Zod generator (would need to keep or regenerate Zod separately). Worth doing if OWL export or multi-language pipeline ever becomes a goal.

## Projects — package version on landing cards

- [ ] **Show package version on GitHub project cards** — for projects published to a package registry (crates.io, npm, PyPI, etc.), fetch and display the latest version number on the landing page card. The `url` field already points to the registry page for some projects (e.g. quizzical → crates.io); could use registry APIs (crates.io `/api/v1/crates/{name}`, npm registry, PyPI JSON API) at build time or runtime to pull the latest version string and render it as a small chip on the card.

## Projects — link audit & display order

- [ ] **Audit all `url` fields in YAML** — verify every project `url` actually resolves to a live page; fix or remove dead links
- [ ] **Review project display order in CV/resume** — current sort is featured-first then year desc; decide if a manual ordering or different priority makes more sense for the top 8

## Split TECH_CATEGORIES vocabulary file

- [x] **Split `tech-categories.ts` into separate bounded vocabulary files** — `TECH_CATEGORIES` now contains technologies, domains, soft skills, and personal skills all in one Record, which is confusing naming. Split into e.g. `TECH_VOCAB`, `DOMAIN_VOCAB`, `SOFT_SKILL_VOCAB`, `PERSONAL_VOCAB` (or a unified `TERM_CATEGORIES` with a clearer name), update Landing.tsx and the validate script accordingly.

## Type hierarchy organization

- [ ] **Organize and document skill/domain/extracurricular type hierarchies** — The `SkillSchema` `category` enum, extracurricular `type` values (scholarly/organization/volunteer), and similar categorical fields are scattered and undocumented. Audit all enum-like fields in `schema.ts`, define a canonical type hierarchy (e.g., skill categories, extracurricular types, publication statuses), and ensure every YAML entry uses valid values. Consider a shared `types.ts` or constants file so the hierarchy is explicit and easy to extend.

## Certifications — add links

- [x] **Audit and add `url` fields to all certification entries** — Many certs in the YAML are missing `url` fields pointing to the credential verification page (e.g., Credly badge, issuer portal, LinkedIn credential). Add URLs so they render as clickable links in the CV/resume.

## Skills section orphans — attach or drop

These were in the now-deleted `skills:` YAML section but are not attached to any entry. Decide: attach to the right entry, or drop entirely.

- [ ] `FastAPI` — used somewhere? check projects/work
- [ ] `Git` — certainly used everywhere; just not explicitly tagged on any entry
- [ ] `Linux Ubuntu` — OS; `Linux` is in COMPETENCY_CATEGORIES but not `Linux Ubuntu`; may need rename
- [ ] `Microsoft Copilot` — used personally? attach or drop
- [ ] `NLTK` — no repo evidence found in BFO-Wikidata, bert_benchmarking, bfobert, swebok-rebel-rdf
- [ ] `TensorFlow` — no repo evidence found in same repos
- [ ] `Windows (XP, Vista, 7, 8, 10, 11)` — name mismatch; COMPETENCY_CATEGORIES has `Windows` only

## Scientific Writing — move from soft_skills to domains in YAML

- [ ] **Move ~62 `Scientific Writing` entries from `soft_skills:` to `domains:` in YAML** — The vocab was updated to categorize it as a domain, but the YAML field placement (`soft_skills:` vs `domains:`) still needs manual cleanup entry by entry.

## Other pending

- [x] **Audit `tags` field in YAML schema** — Removed all 74 tags fields; content fully covered by `domains` and `technologies`.

- [x] **Audit YAML for redundant data** — Removed description from 57 work/project entries where bullets was present (templates use bullets only). Remaining: date_display, title_line, org still needed by Jinja2 templates — defer until legacy view is ported.

- [ ] proj/personal — catch-all personal/creative entry (Adobe, AutoCAD, etc.); needs tech/domains review and possible restructure or deletion



- [x] **Tests: detect unmapped terms** — Test suite should flag technologies/domains/soft_skills/personal_skills that appear in YAML but aren't recognized/validated. Example: `Git` is in YAML but doesn't show in UI (unmapped in tech-categories). Need validation that catches these orphan terms.
- [ ] Extracurriculars — add technologies/domains to entries missing coverage:
  - [ ] `extra/comptia-study-guide` — suggest: `Markdown`
  - [x] `extra/swebok-v4-review` — no obvious technologies; maybe just domains
  - [x] `extra/dair-prompt-engineering` — suggest: `Markdown`, `Git`
  - [ ] `extra/ontogpt-contributor` — suggest: `Python`, `Git`, `OWL`
  - [x] `extra/huge-ai-models-contributor` — suggest: `Markdown`, `Git`
  - [ ] `extra/practical-nlp-errata` — no obvious technologies
  - [ ] `extra/semantalytics-contributor` — suggest: `RDF`, `OWL`
  - [ ] `extra/generativeai-and-linkeddata` — suggest: `Python`, `RDF`, `JSON-LD`; needs domains too
  - [ ] `extra/machine-learning-ontologies` — suggest: `OWL`, `Protégé`, `BFO`
  - [ ] `extra/openai-cybersecurity-grant-proposal` — suggest: `Markdown`; needs domains too
  - [ ] `extra/protegetutorials` — has `GraphViz`, no domains; suggest: `Protégé`, `OWL`
  - [ ] `extra/ieee-member` — org membership; probably skip
  - [ ] `extra/asee-member` — org membership; probably skip
  - [ ] `extra/erau-ai-club` — suggest: `Python`
- [ ] work/publix — add technologies (minimal)
- [x] Publications UI — pub domains already aggregated into the landing page skill chips (paradigms category); no per-row chips needed
- [ ] LLM model coverage — audit all work/project/pub/extracurricular entries and add specific model names where used:
  - OpenAI: `GPT-3.5`, `GPT-4`, `GPT-4o`, `o1`, `o3`, `ChatGPT`, `Codex`, `OpenAI API`
  - Anthropic: `Claude 3`, `Claude 3.5 Sonnet`, `Claude Code`, `Anthropic API`
  - Google: `Gemini 1.5`, `Gemini 2.0`, `Gemini API`
  - Meta: `Llama`, `Llama 3`
  - Other: `Grok`, `Mistral`, `Mixtral`, `Copilot`
  - Currently entries use generic "GPT", "Claude", "Gemini" — replace/supplement with specific model versions where known

## Projects — domains/technologies (need local clones)

Local clones not available; grab and analyze with Claude when possible.

- [ ] proj/bfo-wikidata-classifier — https://github.com/PR0CK0/BFO-Wikidata-Classifier
- [ ] proj/bert-benchmarking — https://github.com/PR0CK0/bert_benchmarking
- [ ] proj/bfobert — https://github.com/PR0CK0/bfobert
- [ ] proj/stable-diffusion-testing — https://github.com/PR0CK0/StableDiffusionEndToEndGuide
- [ ] proj/nlp-optimization — https://github.com/PR0CK0/Mandelbrot-Set-Calculation-Optimization-in-Scientific-Python
- [ ] proj/bfo-buddy — https://github.com/PR0CK0/bfobuddy
- [ ] proj/usa-obesity-visualization — https://github.com/PR0CK0/RandomDataAnalysisProjects
- [ ] proj/upper-martial-arts-ontology — https://github.com/PR0CK0/UpperMartialArtsOntology
- [ ] proj/volusia-elevation-qgis — https://github.com/PR0CK0/CS540_Project
- [ ] proj/meme-ontology — https://github.com/PR0CK0/knowyourmeme.com-Crawler
- [ ] proj/vxworks-water-heater — https://github.com/PR0CK0/VxWorksWaterHeater
- [ ] proj/lan-board-game — https://github.com/PR0CK0/SOS-Game-LAN-Capable
- [ ] proj/monster-hunter-world — https://github.com/PR0CK0/mhw
- [ ] proj/eagle-listings — https://github.com/PR0CK0/EagleListings
- [ ] proj/tiles-game — https://github.com/PR0CK0/TilesGame
- [ ] proj/text-racing-game — https://github.com/PR0CK0/C_TextBasedRacingGame
