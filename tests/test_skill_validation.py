#!/usr/bin/env python3
"""
Validates that all skill fields (technologies, domains, soft_skills, personal_skills)
in tyler-procko.yaml are properly defined in the validation layer.

Technologies must be in tech-categories.ts.
Soft skills must be in VALID_SOFT_SKILLS.
Domains and personal_skills are collected and reported for review.
Duplicate values within a single entry are flagged for all fields.
"""

import sys
from pathlib import Path
import yaml
import re

YAML_PATH = Path(__file__).parent.parent / "public" / "data" / "tyler-procko.yaml"
TECH_CATEGORIES_PATH = Path(__file__).parent.parent / "src" / "lib" / "tech-categories.ts"

SKILL_FIELDS = ["technologies", "domains", "soft_skills", "personal_skills"]
SECTIONS = ["work_experiences", "projects", "publications", "courses", "awards", "talks", "education", "certificates", "extra"]

# Canonical soft skills list — add new values here when introducing them in the YAML
VALID_SOFT_SKILLS = {
    "Client Communication",
    "Public Speaking",
    "Stakeholder Presentation",
    "Virtual Presentation",
}


def extract_tech_categories():
    """Parse tech-categories.ts and extract all mapped technologies."""
    content = TECH_CATEGORIES_PATH.read_text()
    pattern = r"(?:'([^']+)'|([^\s:]+)):\s+'[^']+'"
    matches = re.findall(pattern, content)
    techs = set()
    for quoted, unquoted in matches:
        techs.add(quoted or unquoted)
    return techs


def main() -> None:
    data = yaml.safe_load(YAML_PATH.read_text())
    mapped_techs = extract_tech_categories()

    # Collect all unique values by field (across all entries)
    all_skills = {field: set() for field in SKILL_FIELDS}
    unmapped_techs = set()
    issues = []

    for section in SECTIONS:
        entries = data.get(section, [])
        if not isinstance(entries, list):
            continue

        for entry in entries:
            if not isinstance(entry, dict):
                continue

            entry_id = entry.get("id", entry.get("title", "unknown"))

            for field in SKILL_FIELDS:
                values = entry.get(field, [])
                if not isinstance(values, list):
                    issues.append(f"  {entry_id} → {field}: not a list")
                    continue

                # Duplicate check within this entry
                seen = set()
                for value in values:
                    if value in seen:
                        issues.append(f"  {entry_id} → {field}: duplicate '{value}'")
                    seen.add(value)
                    all_skills[field].add(value)

                    # Technologies must be in tech-categories.ts
                    if field == "technologies" and value not in mapped_techs:
                        unmapped_techs.add(value)
                        issues.append(f"  {entry_id} → {field}: '{value}' NOT in tech-categories.ts")

                    # Soft skills must be in canonical list
                    if field == "soft_skills" and value not in VALID_SOFT_SKILLS:
                        issues.append(f"  {entry_id} → {field}: '{value}' NOT in VALID_SOFT_SKILLS")

    # Report unmapped technologies separately for visibility
    if unmapped_techs:
        print(f"ERROR — {len(unmapped_techs)} unmapped technology(ies):\n")
        for tech in sorted(unmapped_techs):
            print(f"  • {tech}")
        print()

    if issues:
        print(f"FAIL — {len(issues)} validation issue(s):\n")
        for issue in sorted(issues):
            print(issue)
        sys.exit(1)

    # Summary
    print("SKILL FIELD SUMMARY:")
    print(f"  Technologies (mapped):   {len(all_skills['technologies'])} unique")
    print(f"  Domains:                 {len(all_skills['domains'])} unique")
    print(f"  Soft Skills:             {len(all_skills['soft_skills'])} unique")
    print(f"  Personal Skills:         {len(all_skills['personal_skills'])} unique")
    print()
    print("OK — all validations passed")


if __name__ == "__main__":
    main()
