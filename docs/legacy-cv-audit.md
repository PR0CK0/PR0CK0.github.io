# Legacy CV retirement audit

Audited 2026-11-20 against commit `32ec0ed`. **Retirement is blocked by rendering gaps, content reconciliation, and inbound links.** Neither historical HTML file has been removed.

## Evidence and scope

- Compared `public/legacy/index.html` and `public/legacy/index-new.html`: identical visible text and identical ordered link lists. Differences in their HTML do not represent separate CV content.
- Extracted text with Python's HTML parser, excluding comments, scripts, and styles. Each historical copy has 1,057 nonempty text segments. Compared all 100 changed blocks against `public/legacy/cv.html`, then inspected the affected YAML records and templates. Text segmentation is not a record count.
- Confirmed that rendering the current YAML through the current Jinja templates produces exactly the tracked `cv.html`. The gaps below are reproducible template behavior, not a stale generated file.
- Checked the React CV data builder separately. It already displays project descriptions and all five extracurricular categories. The legacy rendering gaps should not be attributed to the React CV.
- Every old hyperlink absent from the generated CV still appears verbatim in the YAML. This checks retention, not whether external destinations are live.
- Scanned links in public HTML and the template/source references to the two historical files.

## Rendering gaps in the generated legacy CV

Counts below apply to the current YAML after `cv_exclude` filtering.

| Finding | Evidence | Required correction |
|---|---|---|
| All 41 project descriptions are omitted | Every included project has `description`; none has `bullets`. `templates/partials/projects.html.j2` only renders `bullets`. | Render the canonical description and available project/repository links. |
| 12 extracurricular records are omitted entirely | The template selects only scholarly, organization, and volunteer types. It omits ten open-source records and two conferences. | Render all five supported categories. |
| 20 included extracurricular records have empty headings | The template reads removed `h4` fields instead of `title`, `organization`, and `url`. Some entries still show bullets beneath the empty heading. | Build headings from the current fields. |
| 19 of those 20 records have blank dates | The template reads `date_display`; most records use `date`, `start_date`, `end_date`, and `is_current`. | Render current date fields and ranges without inventing ongoing status. |
| 14 stored primary-author credits are omitted | Publication branches depend on removed `primary_author_position` fields. `primary_author` remains in YAML. | Render existing author information without presentation-position flags. |
| Competition-proposal detail is omitted | `pub/competition-proposal-nas` stores its finalist/advisor note in `description`; the template reads removed `after_link_text`. | Render the stored description. |
| Some publication labels are empty | Records without `author_role` produce `():`; missing venues can produce a lone dash. | Omit absent optional decorations. |

The publication template also contains branches for removed `close_span_before_end_link` and `after_span_text` fields. These need removal when that template is corrected.

## Historical details needing an editorial decision

Many work bullets and project descriptions were rewritten or condensed. That is not automatically data loss. However, the following concrete details from the old files are not fully represented by the current records:

| Record | Historical detail to reconcile |
|---|---|
| `proj/ludum-dare-44` | 48-hour duration, top-three-percent placement, and responsibility for art/music. |
| `proj/arocket` | Hackathon placement, refueling/landing behavior, media creation, and physics contribution. |
| `proj/nas-server` | Historical capacity and RAID level, plus data naming/governance/security work. Do not assume old hardware specifications remain current. |
| `proj/ms-word-usability` | Named evaluation scales, UX personas, and three empirical studies. |
| `proj/ecocar` | Autopilot contribution and the specific documentation responsibilities. |
| `proj/encrypted-sound-messages` | Public-key encryption detail. |
| `proj/boe-bot-robot` | Response to colored-object positions, beyond line following. |
| `work/afrl-2022` | OBO familiarity; SNOMED-CT is still retained as a technology. |

This is a factual-reconciliation list, not a claim that every old sentence should be restored. Other differences include condensed technical implementation details and changed work metrics. Keep current wording unless the older detail is deliberately reinstated in the YAML.

Do not restore superseded content such as the stealth company name, the old clearance claim, an in-progress Security+ status, or the earlier ongoing A/V role. Current YAML reflects subsequent updates. Three early volunteer entries remain stored but explicitly excluded from CV output; their absence is intentional.

## Links that prevent deletion

Five links in retained/generated pages still point to `public/legacy/index.html`:

| Source | Existing target |
|---|---|
| `templates/partials/header.html.j2`, emitted into `public/legacy/cv.html` | `index.html#top` |
| `public/legacy/personal/personal.html` | `../index.html` |
| `public/legacy/resources/resources.html` | `../index.html#top` |
| `public/legacy/ss/ss.html` | `../index.html#top` |
| `public/legacy/ss/ss.html` | `../index.html` |

No inbound links to `index-new.html` were found. Historical files also contain their own navigation links. Before retirement, point retained legacy navigation at the current generated CV or the appropriate React route and verify navigation in the browser. Repository searches cannot establish whether external bookmarks still use the old URLs.

## Other differences to keep separate

- The React CV is a selected presentation of YAML, not a complete reproduction of the legacy page. Courses, standards familiarity, literacy, and dated personal sections still exist in YAML/legacy output but are not all emitted by `buildCVData`.
- The legacy header hardcodes a Spring 2026 availability schedule. Its footer hardcodes a March 2026 update date and handwritten/not-by-AI presentation. These are stale template claims rather than missing historical data.
- Publication grouping and count policy are unchanged by this audit.

## Completion order

1. Repair legacy rendering against the current YAML, with tests covering descriptions, all extracurricular categories, dates, and author/detail fields.
2. Decide which historical details to preserve; put approved content in the YAML, then regenerate the legacy CV.
3. Update the five inbound links and verify retained legacy navigation.
4. Retire historical HTML copies only after those checks pass; preserve history through Git and decide how old direct URLs should behave.

The audit itself changes no site content, rendering, or routes.
