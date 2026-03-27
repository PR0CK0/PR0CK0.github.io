#!/usr/bin/env python3
"""Build script: renders data/tyler-procko.yaml into public/legacy/index-new.html via Jinja2 templates."""

import yaml
from jinja2 import Environment, FileSystemLoader
from pathlib import Path

_MONTH_NAMES = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'June', '07': 'July', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
}


def pub_date(date_val):
    """Convert YAML date (e.g. '2024-10') to display form (e.g. 'Oct 2024')."""
    if date_val is None:
        return '-'
    s = str(date_val).strip()
    if s == '-' or '-' not in s:
        return s
    parts = s.split('-')
    if len(parts) >= 2:
        year, month = parts[0], parts[1].zfill(2)
        return f"{_MONTH_NAMES.get(month, month)} {year}"
    return s

BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "data" / "tyler-procko.yaml"
TEMPLATE_DIR = BASE_DIR / "templates"
OUTPUT_FILE = BASE_DIR / "public" / "legacy" / "index-new.html"


def load_data():
    with open(DATA_FILE, encoding="utf-8") as f:
        return yaml.safe_load(f)


def build():
    data = load_data()

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        trim_blocks=True,
        lstrip_blocks=True,
        autoescape=False,
        keep_trailing_newline=True,
    )
    env.filters['pub_date'] = pub_date

    template = env.get_template("index.html.j2")
    output = template.render(**data)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Built: {OUTPUT_FILE}")


if __name__ == "__main__":
    build()
