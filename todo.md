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
- [ ] pub/robust-training-datasets-ontologies
- [ ] pub/semantic-science-beyond-pdf
- [ ] pub/dawn-of-dialogue
- [ ] pub/lm-kg-survey
- [ ] pub/scrum-in-classroom
- [ ] pub/gps-signal-strength
- [ ] pub/auto-code-documentation
- [ ] pub/gpt4-stochastic-parrot
- [ ] pub/catastrophic-forgetting
- [ ] pub/digital-rubber-duck
- [ ] pub/validating-security-requirements-kg
- [ ] pub/secure-development-ontology
- [ ] pub/vr-software-requirements
- [ ] pub/ml-misbehaviors-taxonomy
- [ ] pub/kg-geospatial-sumo
- [ ] pub/sdlc-ontology-engineering
- [ ] pub/cognitive-assistants-aviation-inprogress
- [ ] pub/colleague-thesis-vonderhaar
- [ ] pub/colleague-thesis-kiselev
- [ ] pub/competition-proposal-nas
- [ ] pub/grant-proposal-nsf
- [ ] pub/article-synthetic-ontologies

## Graph

- [ ] Graph: clicking a skill chip navigates to the graph with `?q=<skill>` and the node is found/searched, but neighborhood dimming doesn't apply until you manually re-click the node. `layoutstop` approach attempted — Cytoscape class application timing is tricky here.

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

## Potential / Future

- [ ] **LinkML schema migration** — Replace `schema.ts` (Zod) with a LinkML schema (`schema.yaml`). Data YAML stays identical. Gains: build-time `linkml-validate`, `gen-owl` produces an OWL ontology of the CV (cool talking point), `gen-python` for typed Python models, `gen-json-schema` for JSON Schema validation. Cost: Python codegen step added to build pipeline, no official Zod generator (would need to keep or regenerate Zod separately). Worth doing if OWL export or multi-language pipeline ever becomes a goal.

## Other pending

- [ ] **Audit `tags` field in YAML schema** — Determine the purpose and usage of `tags` across entries. It overlaps with `domains` and `technologies`. Decide whether to keep, merge into domains, or remove.

- [ ] **Audit YAML for redundant data** — Check for fields that duplicate other fields (e.g., `description` vs `bullets`, `title_line` vs `title`, `org` vs `organization`). Determine if legacy-only fields can be derived at build time rather than duplicated in the YAML.

- [ ] proj/personal — catch-all personal/creative entry (Adobe, AutoCAD, etc.); needs tech/domains review and possible restructure or deletion



- [ ] **Tests: detect unmapped terms** — Test suite should flag technologies/domains/soft_skills/personal_skills that appear in YAML but aren't recognized/validated. Example: `Git` is in YAML but doesn't show in UI (unmapped in tech-categories). Need validation that catches these orphan terms.
- [ ] Extracurriculars — add technologies/domains to 24 empty entries
- [ ] work/publix — add technologies (minimal)
- [ ] Publications UI — wire up `domains` as tag chips in PublicationRow
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
