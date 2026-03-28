# procko.pro — Active Work Plan

## Context

Site is live at procko.pro. React/Vite SPA deployed to GitHub Pages via GitHub Actions.
Single source of truth: `data/tyler-procko.yaml`.
Working branch: `linkml-redesign` → pushes to `main` to deploy.
Do NOT push every edit — batch changes, push when user says.

Run `python3 build.py` before committing to regenerate `public/legacy/cv.html`.

---

## Pending (not yet pushed)

- Title rebranded to `AI Engineer — Agentic LLMs · Knowledge Graphs · Ontologies` in YAML, public YAML, Landing.tsx, index.html meta tag
- Mobile horizontal overflow fix: `overflow-x: hidden` on html/body/root in index.css; nav inner div gets `overflow-x-auto`

---

## Task Order

```
#22 Schema: split languages → prog_languages + data_languages
 └─ #23 YAML: re-categorize all skills to new categories
 └─ #18 Build tech→category lookup table (src/lib/tech-categories.ts)
     └─ #24 Update lookup table with new category split
         └─ #20 Rewrite SkillsMatrix as tech occurrence aggregator

#17 Add repo-backed technologies to each project in YAML
    Add missing projects: dissenter, ProvTracer

#21 Push all batched changes (run build.py first)

#19 Work experience technologies (LAST — needs user input per job)
```

---

## Task Details

### Task 17 — Add repo-backed technologies to each project in YAML
Per-project additions (from agent audit):

| Project | Add to technologies |
|---|---|
| `proj/ai-landscape-digest` | `Gemini`, `Codex`, `GitHub Pages`, `feedparser`, `PyYAML` |
| `proj/biomed-paper-extractor` | `Gradio`, `PyTorch`, `scispaCy`, `Flair`, `Plotly`, `PyMuPDF`, `BeautifulSoup4`, `Anthropic SDK`, `google-genai` |
| `proj/health-optimization-kg` | `LlamaIndex`, `Ollama`, `KuzuDB`, `Vite` |
| `proj/bfo-wikidata-classifier` | `sentence-transformers`, `scikit-learn`, `PyTorch`, `RDFLib`, `Hugging Face` |
| `proj/bert-benchmarking` | `scikit-learn`, `Pandas`, `DistilBERT`, `RoBERTa`, `ALBERT`, `DeBERTa`, `Transformers` |
| `proj/bfobert` | `PyTorch`, `Transformers` |

New projects to add:
- **`proj/dissenter`** — PyPI package; Python, LiteLLM, Ollama, Claude, Gemini, OpenAI, Typer, Rich, MoA/multi-LLM ensemble
- **`proj/provtracer`** — dissertation tool; Python, PyQt6, SPARQL, PROV-O, RDFLib

### Task 18 — Build tech→category lookup table (`src/lib/tech-categories.ts`)
Maps every technology name string → display category. Replaces YAML `skills:` block as
the categorization source for the React landing page. Do alongside Task #24.

### Task 19 — Add technologies to work_experience entries (LAST — needs user input)
Schema already supports `technologies: []` on work_experiences.
User will walk through each job to map private-repo skills:
- Streamlit, TensorFlow, FastAPI, Neo4j, MongoDB, AWS S3/Bedrock, GCP, Kubernetes, etc.

### Task 20 — Replace SkillsMatrix with tech occurrence aggregator
Rewrite `SkillsMatrix` in `Landing.tsx` to:
1. Aggregate all `technologies` from `person.projects` + `person.work_experiences`
2. Count occurrences of each tech across all entries
3. Look up category via `TECH_CATEGORIES` from Task 18
4. Sort chips within each category by count descending
5. Show occurrence count as the chip badge (replaces years)
Remove dependency on `person.skills` for the landing page matrix.

### Task 21 — Push all batched changes
Commit everything in one clean push. Run `python3 build.py` first.

### Task 22 — Split `languages` into `prog_languages` and `data_languages` in schema
In `src/lib/schema.ts`, update SkillSchema category enum:
- Remove `languages`
- Add `prog_languages` ("Programming Languages") and `data_languages` ("Data Languages")
- Keep `cloud`, `os`, `design`, `soft_skills` as visible (not hidden) categories
Update `CATEGORY_META` and `SHOWN_CATEGORIES` in `Landing.tsx`.

All 9 visible categories and their labels:
| key | label |
|---|---|
| `prog_languages` | Programming Languages |
| `data_languages` | Data Languages |
| `libraries` | Libraries |
| `tools` | Tools |
| `ai_tools` | AI / ML |
| `vocabularies` | Ontologies & Vocabularies |
| `cloud` | Cloud & Deployment |
| `os` | Operating Systems |
| `design` | Design & Analysis |
| `soft_skills` | Soft Skills |

### Task 23 — Re-categorize all skills in YAML
Move skills to correct new categories:
- `prog_languages`: Java, Python, C, JavaScript, TypeScript, C#, Ruby, R, HTML, CSS, Markdown, Fortran
- `data_languages`: OWL, Turtle, TriG, SHACL, SWRL, SPARQL, GeoSPARQL, RDF, JSON-LD, SQL, Cypher, JSON Schema
- Populate `cloud`, `os`, `design`, `soft_skills` from `skills_legacy` data
Depends on Task #22 (schema must be updated first so Zod validation passes).

### Task 24 — Update lookup table with new category split
Ensure `src/lib/tech-categories.ts` maps all techs to `prog_languages` / `data_languages`
instead of old `languages`. Add cloud, os, design, soft_skills mappings too.

---

## Skill Category Normalization Reference

### What goes where

| Category | Examples |
|---|---|
| `prog_languages` | Java, Python, C, JavaScript, TypeScript, C#, Ruby, R, HTML, CSS, Markdown |
| `data_languages` | OWL, Turtle, TriG, SHACL, SWRL, SPARQL, GeoSPARQL, RDF, JSON-LD, SQL, Cypher |
| `libraries` | PyTorch, NumPy, Pandas, LlamaIndex, LiteLLM, sentence-transformers, RDFLib, spaCy, Gradio, React, Cytoscape.js |
| `tools` | Protégé, Stardog, GraphDB, Git, Docker, Jupyter, VS Code, QGIS, Wikidata |
| `ai_tools` | Claude, GPT, Ollama, Stable Diffusion, Hugging Face, DistilBERT, RoBERTa, CLIP, YOLO |
| `vocabularies` | BFO, CCO, SKOS, Schema.org, FOAF, PROV-O, DCTerms, IAO, DOLCE, BIBO, GeoSPARQL (vocab) |
| `cloud` | Docker, Kubernetes, AWS S3, AWS Bedrock, GCP, GitHub Actions, GitHub Pages, Heroku |
| `os` | Windows, macOS, Linux, Android, Google Colab |
| `design` | Tableau, RStudio, Draw.io, Mermaid, LucidChart, Miro, Adobe suite, Unity |
| `soft_skills` | Technical presentation, Fast startup pace, Large team collaboration |

---

## Skills: Hardcoded With No Public Repo Evidence
(Address in Task #19 via work experience mapping, or remove if truly stale)
TensorFlow, FastAPI, Streamlit, Neo4j, MongoDB, Fortran, TriplyDB, AWS S3, AWS Bedrock,
GCP, Heroku, Kubernetes, PyVis, Topaz Video AI, Midjourney, Copilot, Grok

## Skills: In Legacy View But Not in React `skills:` Block
(Will be covered once tech aggregation is in place via Task #20)
NumPy, Pandas, Matplotlib, Seaborn, NLTK, SPARQLWrapper, OpenAI SDK,
JavaFX, OwlAPI, Apache Jena, Protégé, Stardog, Ontotext Refine, PostgreSQL,
QGIS, Jupyter, Docker, LM Studio, Tensorboard, CVAT,
SKOS, Schema.org, DCTerms, FOAF, PROV-O, GeoSPARQL, WordNet, IAO, DOLCE, BIBO, DICO,
Tableau, RStudio, Mermaid, Draw.io, CLIP, ResNet, YOLO, all-MiniLM

---

## Already Done (this session)

- Removed "Semantic Science" from legacy nav tab
- Added `semanticscience.us` as external link in React nav
- Created `CLAUDE.md` (edit YAML for all personal content updates)
- Clearance → `Inactive Secret (Tier 3)` in YAML + legacy template made data-driven
- Legacy output renamed to `cv.html` (fixes `/legacy/` route conflict)
- Boot sequence animation ~1.5s (was ~3.1s)
- "View all N projects on GitHub →" link under projects section
- Title rebranded to `AI Engineer — Agentic LLMs · Knowledge Graphs · Ontologies`
- Removed redundant `Ph.D.` from hero subtitle
- Summary template clearance line made data-driven (`{{ clearance }}`)
- Summary template title line made data-driven (`{{ title }}`)
- Mobile horizontal overflow fixed (not yet pushed)
- Ph.D. removed from hero subtitle (not yet pushed)
