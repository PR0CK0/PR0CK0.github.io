# CLAUDE.md — procko.pro

## Single source of truth

**`data/tyler-procko.yaml` is the only place personal content lives.**

Whenever Tyler wants to add or update anything about himself — a new job, publication, project, skill, award, certification, talk, course, or any other CV/portfolio item — the change goes directly into `data/tyler-procko.yaml`. Never hardcode personal content into templates, React components, or any other file.

After editing the YAML:
- The React app picks up changes automatically at runtime (no rebuild needed for content).
- Run `python3 build.py` to regenerate `public/legacy/index.html` from the updated YAML.
