"""
Syncs GitHub repo "About" descriptions into public/data/tyler-procko.yaml.

For every project entry that has a repo_url pointing to github.com, the script
fetches the current description from the GitHub API and updates the YAML field
if it differs. Uses ruamel.yaml for round-trip parsing that preserves comments,
ordering, and formatting as much as possible.

Usage:
    GITHUB_TOKEN=<token> python3 .github/scripts/sync_repo_descriptions.py

Exit codes:
    0 — completed (with or without changes)
    1 — fatal error
"""

from __future__ import annotations

import os
import re
import sys
import time
import urllib.request
import urllib.error
import json

try:
    from ruamel.yaml import YAML
except ImportError:
    print("ERROR: ruamel.yaml is required. Install with: pip install ruamel.yaml")
    sys.exit(1)

YAML_PATH = "public/data/tyler-procko.yaml"
TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO_RE = re.compile(r"https://github\.com/([^/]+)/([^/\s]+?)/?$")


def gh_get(owner: str, repo: str) -> str | None:
    """Fetch a repo's description from the GitHub API. Returns None on error."""
    url = f"https://api.github.com/repos/{owner}/{repo}"
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
            return data.get("description") or None
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} fetching {owner}/{repo}")
        return None
    except Exception as e:
        print(f"  Error fetching {owner}/{repo}: {e}")
        return None


def main() -> None:
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = 120

    with open(YAML_PATH, encoding="utf-8") as f:
        data = yaml.load(f)

    projects = data.get("projects") or []
    changes = 0

    for project in projects:
        repo_url = (project.get("repo_url") or "").strip().rstrip("/")
        if "github.com" not in repo_url:
            continue

        m = REPO_RE.match(repo_url)
        if not m:
            continue
        owner, repo = m.group(1), m.group(2)

        print(f"Checking {owner}/{repo} ...", end=" ", flush=True)
        gh_desc = gh_get(owner, repo)
        time.sleep(0.2)

        if not gh_desc:
            print("(no GitHub description — skipped)")
            continue

        current = (project.get("description") or "").strip()
        if current == gh_desc.strip():
            print("up to date")
            continue

        print(f"UPDATED\n  was: {current[:80]!r}\n  now: {gh_desc[:80]!r}")
        project["description"] = gh_desc
        changes += 1

    if changes:
        with open(YAML_PATH, "w", encoding="utf-8") as f:
            yaml.dump(data, f)
        print(f"\n✓ {changes} description(s) updated and written to {YAML_PATH}")
    else:
        print("\nNo changes needed.")


if __name__ == "__main__":
    main()
