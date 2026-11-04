"""Validate portfolio references against public/data/competencies.json.

Unknown references, ambiguous catalog entries, and duplicate usage fail validation.
Field/category disagreements are reported for editorial review without changing data.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from ruamel.yaml import YAML

ROOT = Path(__file__).resolve().parents[2]
YAML_PATH = ROOT / 'public' / 'data' / 'tyler-procko.yaml'
CATALOG_PATH = ROOT / 'public' / 'data' / 'competencies.json'
ENTRY_SECTIONS = (
    'work_experiences', 'publications', 'projects', 'extracurriculars',
    'talks', 'courses', 'education', 'certificates',
)
FIELD_CATEGORIES = {
    'technologies': None,
    'domains': 'domains',
    'soft_skills': 'soft_skills',
    'personal_skills': 'personal',
}


def load_catalog(path: Path | None = None) -> dict[str, dict]:
    """Resolve IDs, labels, and aliases using trimmed, case-insensitive keys."""
    data = json.loads((path or CATALOG_PATH).read_text(encoding='utf-8'))
    if not isinstance(data, dict) or not isinstance(data.get('categories'), dict) or not isinstance(data.get('terms'), list):
        raise ValueError('Catalog requires categories and a terms list')
    lookup: dict[str, dict] = {}
    ids: set[str] = set()
    for term in data['terms']:
        if not isinstance(term, dict):
            raise ValueError('Each catalog term must be an object')
        if any(not isinstance(term.get(k), str) or not term[k].strip() for k in ('id', 'label', 'category')):
            raise ValueError('Each term requires a nonempty ID, label, and category')
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', term['id']):
            raise ValueError(f"Invalid term ID: {term['id']}")
        if term['category'] not in data['categories']:
            raise ValueError(f"Unknown category: {term['category']}")
        aliases = term.get('aliases')
        if not isinstance(aliases, list) or any(not isinstance(a, str) or not a.strip() for a in aliases):
            raise ValueError(f"Invalid aliases for {term['id']}")
        term_id = term['id'].strip().lower()
        if term_id in ids:
            raise ValueError(f"Duplicate term ID: {term['id']}")
        ids.add(term_id)
        for index, value in enumerate((term['id'], term['label'], *aliases)):
            key = value.strip().lower()
            if key in lookup:
                # A label may equal its own ID; other collisions are ambiguous.
                if lookup[key] is term and index == 1 and key == term_id:
                    continue
                raise ValueError(f'Ambiguous catalog reference: {value}')
            lookup[key] = term
    return lookup


def load_tech_category_keys() -> set[str]:
    """Return catalog labels/aliases for discovery-import validation."""
    return {
        name for term in load_catalog().values()
        for name in (term['label'], *term.get('aliases', []))
    }


def load_yaml() -> dict:
    with YAML_PATH.open(encoding='utf-8') as stream:
        return YAML(typ='safe').load(stream)


def validate_terms(data: dict, lookup: dict[str, dict]) -> tuple[list[str], list[str]]:
    """Separate invalid references from editorial field-placement questions."""
    errors: list[str] = []
    review: list[str] = []
    for section in ENTRY_SECTIONS:
        for entry in data.get(section) or []:
            eid = entry.get('id') or entry.get('number') or '(unknown)'
            for field, expected in FIELD_CATEGORIES.items():
                values = entry.get(field) or []
                if not isinstance(values, list):
                    errors.append(f'{eid} [{field}]: expected a list')
                    continue
                seen: set[str] = set()
                for value in values:
                    term = lookup.get(value.strip().lower()) if isinstance(value, str) else None
                    if term is None:
                        errors.append(f'{eid} [{field}]: unknown term {value!r}')
                        continue
                    if term['id'] in seen:
                        errors.append(f'{eid} [{field}]: duplicate reference to {term["label"]!r}')
                    seen.add(term['id'])
                    category = term['category']
                    misplaced = category != expected if expected else category in ('domains', 'soft_skills', 'personal')
                    if misplaced:
                        review.append(f'{eid} [{field}]: {value!r} is catalogued as {category}')
    return errors, review


def main() -> int:
    try:
        errors, review = validate_terms(load_yaml(), load_catalog())
    except (ValueError, OSError) as error:
        print(f'Validation failed: {error}')
        return 1
    if review:
        print(f'Review: {len(review)} field/category placements (non-blocking):')
        for message in review:
            print(f'  {message}')
    if errors:
        print(f'FAIL: {len(errors)} invalid references:')
        for message in errors:
            print(f'  {message}')
        print('Correct references or update public/data/competencies.json.')
        return 1
    print('All competency references resolve.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
