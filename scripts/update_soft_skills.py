#!/usr/bin/env python3
"""
Soft skills update:
- Remove 'Systems Engineering' from proj/bittorrent-semp soft_skills (not a soft skill)
- Add 'Public Speaking' + 'Stakeholder Presentation' to known entities
- 'Virtual Presentation' term defined for future use (webcam/remote speaking)
"""
import yaml

YAML_PATHS = ["data/tyler-procko.yaml", "public/data/tyler-procko.yaml"]

ENTITY_KEYS = ["work_experiences", "publications", "projects", "courses", "extracurriculars"]

# Entities getting Public Speaking + Stakeholder Presentation
PUBLIC_SPEAKING_IDS = {
    "proj/provtracer",
    "pub/towards-agile-academia",
    "pub/microelectronic-ai-dishonesty",
    "work/afrl-2019",
    "work/eram-research-team",
    "work/grader-cs344",
}

ADD_SKILLS = ["Public Speaking", "Stakeholder Presentation"]


def get_id(entity):
    return entity.get("id") or entity.get("number")  # courses use 'number'


for path in YAML_PATHS:
    with open(path) as f:
        data = yaml.safe_load(f)

    for key in ENTITY_KEYS:
        for entity in data.get(key) or []:
            eid = get_id(entity)

            # Remove Systems Engineering from bittorrent project
            if eid == "proj/bittorrent-semp":
                ss = entity.get("soft_skills") or []
                entity["soft_skills"] = [s for s in ss if s != "Systems Engineering"]
                if not entity["soft_skills"]:
                    del entity["soft_skills"]
                print(f"  cleaned {eid}")

            # Add Public Speaking + Stakeholder Presentation
            if eid in PUBLIC_SPEAKING_IDS:
                existing = entity.get("soft_skills") or []
                added = [s for s in ADD_SKILLS if s not in existing]
                if added:
                    entity["soft_skills"] = existing + added
                    print(f"  +soft_skills {eid}: {added}")

    with open(path, "w") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)

print("Done.")
