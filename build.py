#!/usr/bin/env python3
"""Build script: renders data/tyler-procko.yaml into public/legacy/index-new.html via Jinja2 templates."""

import yaml
from jinja2 import Environment, FileSystemLoader
from pathlib import Path

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

    template = env.get_template("index.html.j2")
    output = template.render(**data)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Built: {OUTPUT_FILE}")


if __name__ == "__main__":
    build()
