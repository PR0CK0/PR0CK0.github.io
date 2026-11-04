# Competency classification review

Snapshot: 2026-11-04. The catalog migration preserved all 374 existing labels and categories. No semantic aliases were merged. These are editorial questions, not invalid references: views now consistently use the catalog category even when a record stores a reference under a different field.

## Decisions to review

- `NLP` is categorized as `ai_tools`, while `Natural Language Processing` is a domain. Decide whether these mean the same competency, then choose its category and retain the other name as an alias if appropriate.
- `RAG` and `Retrieval-Augmented Generation` are potential aliases. Confirm intended meaning before merging records under one permanent ID.
- `NER` and `VLM` are categorized as AI tools but occur in domains. Decide whether these are techniques, domains, or tools in this portfolio's taxonomy.
- `Agile` and `Public Speaking` occur in domains but are cataloged as soft skills.
- Some technical tools were stored in `personal_skills` on a personal project. A project's context need not change a tool's category.
- `Telegram` remains personal as requested. `Technical Writing` and `Scientific Writing` remain distinct.

After deciding, change the catalog/category or record placement and rerun validation. To merge terms, keep one ID, move the retired label/ID into aliases, and remove the redundant term. Never reuse an existing ID for another concept.

## Placement summary

| Term | Record field | Catalog category | Occurrences |
|---|---|---|---:|
| NLP | `domains` | `ai_tools` | 27 |
| Agile | `domains` | `soft_skills` | 14 |
| NER | `domains` | `ai_tools` | 5 |
| Public Speaking | `domains` | `soft_skills` | 1 |
| VLM | `domains` | `ai_tools` | 1 |
| Topaz Video AI | `personal_skills` | `ai_tools` | 1 |
| Ruby/Rails | `personal_skills` | `prog_languages` | 1 |
| TriplyDB | `personal_skills` | `dev_tools` | 1 |
| Kubernetes | `personal_skills` | `dev_tools` | 1 |
| GoDaddy | `personal_skills` | `cloud` | 1 |
| LucidChart | `personal_skills` | `design` | 1 |
| Google Cloud Platform | `personal_skills` | `cloud` | 1 |
| Heroku | `personal_skills` | `cloud` | 1 |
| Ontotext Refine | `personal_skills` | `dev_tools` | 1 |

## All affected records

Regenerate the current list with `python3 .github/scripts/validate_yaml_terms.py`.

| Record | Field | Term | Catalog category |
|---|---|---|---|
| `work/stealth-startup` | `domains` | NLP | `ai_tools` |
| `work/stealth-startup` | `domains` | Agile | `soft_skills` |
| `work/stealth-startup` | `domains` | NER | `ai_tools` |
| `work/mercor` | `domains` | NLP | `ai_tools` |
| `work/handshake-ai` | `domains` | NLP | `ai_tools` |
| `work/handshake-ai` | `domains` | Agile | `soft_skills` |
| `work/cloudcell-consultant` | `domains` | NLP | `ai_tools` |
| `work/cloudcell-consultant` | `domains` | NER | `ai_tools` |
| `work/the-link` | `domains` | NER | `ai_tools` |
| `work/the-link` | `domains` | NLP | `ai_tools` |
| `work/upwork-software-test` | `domains` | Agile | `soft_skills` |
| `work/forumapi` | `domains` | NLP | `ai_tools` |
| `work/forumapi` | `domains` | Agile | `soft_skills` |
| `work/forumapi` | `domains` | NER | `ai_tools` |
| `work/eram-research-team` | `domains` | NLP | `ai_tools` |
| `work/publix` | `domains` | Public Speaking | `soft_skills` |
| `pub/phd-dissertation` | `domains` | Agile | `soft_skills` |
| `pub/graph-rag-survey` | `domains` | NLP | `ai_tools` |
| `pub/linked-data-aerospace` | `domains` | NLP | `ai_tools` |
| `pub/dawn-of-dialogue` | `domains` | NLP | `ai_tools` |
| `pub/lm-kg-survey` | `domains` | NLP | `ai_tools` |
| `pub/towards-agile-academia` | `domains` | Agile | `soft_skills` |
| `pub/scrum-in-classroom` | `domains` | Agile | `soft_skills` |
| `pub/auto-code-documentation` | `domains` | NLP | `ai_tools` |
| `pub/gpt4-stochastic-parrot` | `domains` | NLP | `ai_tools` |
| `pub/auto-bfo-aristotelian-definitions` | `domains` | NLP | `ai_tools` |
| `pub/digital-rubber-duck` | `domains` | Agile | `soft_skills` |
| `pub/swebok-kg-transformer` | `domains` | NLP | `ai_tools` |
| `pub/microelectronic-ai-dishonesty` | `domains` | NLP | `ai_tools` |
| `pub/microelectronic-ai-dishonesty` | `domains` | Agile | `soft_skills` |
| `pub/interpersonal-chemistry-agile` | `domains` | Agile | `soft_skills` |
| `pub/colleague-thesis-kiselev` | `domains` | NLP | `ai_tools` |
| `proj/provenance-rag-financial-graph` | `domains` | NLP | `ai_tools` |
| `proj/biomed-paper-extractor` | `domains` | NER | `ai_tools` |
| `proj/biomed-paper-extractor` | `domains` | VLM | `ai_tools` |
| `proj/biomed-paper-extractor` | `domains` | NLP | `ai_tools` |
| `proj/bfo-wikidata-classifier` | `domains` | NLP | `ai_tools` |
| `proj/bert-benchmarking` | `domains` | NLP | `ai_tools` |
| `proj/bfobert` | `domains` | NLP | `ai_tools` |
| `proj/personal` | `personal_skills` | Topaz Video AI | `ai_tools` |
| `proj/personal` | `personal_skills` | Ruby/Rails | `prog_languages` |
| `proj/personal` | `personal_skills` | TriplyDB | `dev_tools` |
| `proj/personal` | `personal_skills` | Kubernetes | `dev_tools` |
| `proj/personal` | `personal_skills` | GoDaddy | `cloud` |
| `proj/personal` | `personal_skills` | LucidChart | `design` |
| `proj/personal` | `personal_skills` | Google Cloud Platform | `cloud` |
| `proj/personal` | `personal_skills` | Heroku | `cloud` |
| `proj/personal` | `personal_skills` | Ontotext Refine | `dev_tools` |
| `proj/ecocar` | `domains` | Agile | `soft_skills` |
| `proj/arocket` | `domains` | Agile | `soft_skills` |
| `proj/swebok-rebel-rdf` | `domains` | NLP | `ai_tools` |
| `extra/ontogpt-contributor` | `domains` | NLP | `ai_tools` |
| `extra/practical-nlp-errata` | `domains` | NLP | `ai_tools` |
| `CS225, CS225L` | `domains` | Agile | `soft_skills` |
| `SE510` | `domains` | Agile | `soft_skills` |
| `MA553` | `domains` | NLP | `ai_tools` |
| `cert/stanford-ml-specialization` | `domains` | NLP | `ai_tools` |
