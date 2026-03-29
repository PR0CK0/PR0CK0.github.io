"""
Validates that no list field in tyler-procko.yaml contains duplicate values
within the same entry. Checks: technologies, domains, tags, soft_skills,
personal_skills, skills (top-level category lists).
"""

import sys
from pathlib import Path
import yaml

YAML_PATH = Path(__file__).parent.parent / "public" / "data" / "tyler-procko.yaml"

LIST_FIELDS = {"technologies", "domains", "tags", "soft_skills", "personal_skills"}


def check_duplicates(entry: dict, entry_label: str) -> list[str]:
    errors = []
    for field in LIST_FIELDS:
        values = entry.get(field)
        if not isinstance(values, list):
            continue
        seen = set()
        for v in values:
            if v in seen:
                errors.append(f"  {entry_label} → {field}: duplicate '{v}'")
            seen.add(v)
    return errors


def main() -> None:
    data = yaml.safe_load(YAML_PATH.read_text())
    errors: list[str] = []

    # Top-level sections that are lists of entries with id or number
    sections = {
        "work_experiences": lambda e: e.get("id", "?"),
        "projects": lambda e: e.get("id", "?"),
        "publications": lambda e: e.get("id", "?"),
        "courses": lambda e: e.get("number", "?"),
        "awards": lambda e: e.get("id", "?"),
        "talks": lambda e: e.get("id", "?"),
        "education": lambda e: e.get("id", "?"),
        "certificates": lambda e: e.get("id", "?"),
        "extra": lambda e: e.get("id", "?"),
    }

    for section, labeller in sections.items():
        entries = data.get(section, [])
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            label = f"{section}/{labeller(entry)}"
            errors.extend(check_duplicates(entry, label))

    if errors:
        print(f"FAIL — {len(errors)} duplicate(s) found:\n")
        print("\n".join(errors))
        sys.exit(1)
    else:
        print("OK — no duplicates found in any list field")


if __name__ == "__main__":
    main()
