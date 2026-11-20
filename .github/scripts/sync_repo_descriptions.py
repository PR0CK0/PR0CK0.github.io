"""
Syncs GitHub repository identities, URLs, and "About" descriptions into public/data/tyler-procko.yaml.

For every project entry that has a repo_url pointing to github.com, the script
fetches metadata by stable ID (by URL on first sync) and updates changed fields.
Portfolio IDs, titles, and project-page slugs are preserved. Uses ruamel.yaml
for round-trip parsing that preserves comments, ordering, and formatting as
much as possible.

Usage:
    GITHUB_TOKEN=<token> python3 .github/scripts/sync_repo_descriptions.py

Exit codes:
    0 — completed (with or without changes)
    1 — fatal error
"""

from __future__ import annotations

import os
import sys
import urllib.request
import urllib.error
import json

from repository_identity import reconcile_repositories

try:
    from ruamel.yaml import YAML
except ImportError:
    print("ERROR: ruamel.yaml is required. Install with: pip install ruamel.yaml")
    sys.exit(1)

YAML_PATH = "public/data/tyler-procko.yaml"
TOKEN = os.environ.get("GITHUB_TOKEN", "")


def gh_get(path: str) -> dict | None:
    """Fetch repository metadata by stable ID or URL. Returns None on error."""
    url = f"https://api.github.com{path}"
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} fetching {path}")
        return None
    except Exception as e:
        print(f"  Error fetching {path}: {e}")
        return None


def main() -> None:
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = 120

    with open(YAML_PATH, encoding="utf-8") as f:
        data = yaml.load(f)

    changes = reconcile_repositories(data, gh_get, sync_descriptions=True)

    if changes:
        with open(YAML_PATH, "w", encoding="utf-8") as f:
            yaml.dump(data, f)
        print(f"\n✓ {changes} tracked repository record(s) updated and written to {YAML_PATH}")
    else:
        print("\nNo changes needed.")


if __name__ == "__main__":
    main()
