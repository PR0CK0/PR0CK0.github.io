"""
Validates that every technology, domain, soft_skill, and personal_skill value
used across all YAML entries is recognised — either as a key in COMPETENCY_CATEGORIES
(src/lib/tech-categories.ts) or as a named skill in the YAML skills section.

Exits 0 if everything is mapped; exits 1 and prints offending terms if not.

Usage:
    python3 .github/scripts/validate_yaml_terms.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    from ruamel.yaml import YAML
except ImportError:
    print("ERROR: ruamel.yaml required. pip install ruamel.yaml")
    sys.exit(1)

YAML_PATH       = Path("public/data/tyler-procko.yaml")
VOCAB_DIR       = Path("src/lib/vocab")

# ── Parse COMPETENCY_CATEGORIES keys from TypeScript ────────────────────────────────

def _extract_keys_from_ts(src: str) -> set[str]:
    """Extract Record keys from a TypeScript source string."""
    keys: set[str] = set()
    in_block = False
    for line in src.splitlines():
        # Enter any object literal block (e.g. export const FOO_VOCAB: ... = {)
        if re.search(r"=\s*\{", line) and ("VOCAB" in line or "CATEGORIES" in line):
            in_block = True
        if in_block:
            if line.strip().startswith("}"):
                in_block = False
                continue
            # quoted key: 'foo bar': or "foo bar":
            m = re.match(r"""^\s+['"](.+?)['"]\s*:""", line)
            if m:
                keys.add(m.group(1))
                continue
            # unquoted key: Foo:
            m = re.match(r"""^\s+([A-Za-z][A-Za-z0-9_.+#/&\-]*)\s*:""", line)
            if m:
                keys.add(m.group(1))
    return keys


def load_tech_category_keys() -> set[str]:
    """Extract every term key from the vocab .ts files under src/lib/vocab/."""
    keys: set[str] = set()
    for ts_file in VOCAB_DIR.glob("*.ts"):
        if ts_file.name.startswith("_"):
            continue
        keys |= _extract_keys_from_ts(ts_file.read_text(encoding="utf-8"))
    return keys


# ── Parse YAML ────────────────────────────────────────────────────────────────

def load_yaml() -> dict:
    yaml = YAML()
    with open(YAML_PATH, encoding="utf-8") as f:
        return yaml.load(f)


def skill_names_by_category(data: dict) -> dict[str, set[str]]:
    """Return {category: {skill name, ...}} from the skills section."""
    result: dict[str, set[str]] = {}
    for s in data.get("skills") or []:
        cat = s.get("category", "")
        result.setdefault(cat, set()).add(s["name"])
    return result


# ── Collect all used terms ────────────────────────────────────────────────────

ENTRY_SECTIONS = [
    "work_experiences", "publications", "projects", "extracurriculars",
    "talks", "courses", "education", "certificates",
]

def collect_terms(data: dict) -> dict[str, list[tuple[str, str]]]:
    """
    Returns {field_type: [(entry_id, term), ...]} for every term used across
    all entries.  field_type is one of: technologies, domains, soft_skills,
    personal_skills.
    """
    result: dict[str, list[tuple[str, str]]] = {
        "technologies":    [],
        "domains":         [],
        "soft_skills":     [],
        "personal_skills": [],
    }
    for section in ENTRY_SECTIONS:
        for entry in data.get(section) or []:
            eid = entry.get("id") or entry.get("number") or "(unknown)"
            for field in result:
                for term in entry.get(field) or []:
                    result[field].append((eid, term))
    return result


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    # COMPETENCY_CATEGORIES is the single bounded vocabulary for all term types.
    # technologies → any non-domain category
    # domains      → must map to 'domains'
    # soft_skills  → must map to 'soft_skills'
    # personal_skills → must map to 'personal'
    known = load_tech_category_keys()
    data  = load_yaml()
    used  = collect_terms(data)
    errors: list[str] = []

    for eid, term in used["technologies"]:
        if term not in known:
            errors.append(f"  [technologies]    '{term}'  ({eid})")

    for eid, term in used["domains"]:
        if term not in known:
            errors.append(f"  [domains]         '{term}'  ({eid})")

    for eid, term in used["soft_skills"]:
        if term not in known:
            errors.append(f"  [soft_skills]     '{term}'  ({eid})")

    for eid, term in used["personal_skills"]:
        if term not in known:
            errors.append(f"  [personal_skills] '{term}'  ({eid})")

    if errors:
        # Deduplicate while preserving order
        seen: set[str] = set()
        deduped = [e for e in errors if not (e in seen or seen.add(e))]  # type: ignore[func-returns-value]
        print(f"❌  {len(deduped)} unmapped term(s) found in tyler-procko.yaml:\n")
        for e in deduped:
            print(e)
        print(
            "\nFix: add the term to COMPETENCY_CATEGORIES in src/lib/tech-categories.ts, "
            "or add a skill entry with the correct category to the YAML skills section."
        )
        sys.exit(1)
    else:
        print("✓  All terms mapped.")


if __name__ == "__main__":
    main()
