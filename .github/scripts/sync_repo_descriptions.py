"""
Syncs GitHub repo data into public/data/tyler-procko.yaml.

Two passes per run:

  1. Auto-discover — queries the GitHub API for all public, non-forked repos
     owned by GITHUB_USER that are not yet in the YAML. Creates a minimal
     skeleton entry for each new repo and appends it to the projects list.

  2. Sync descriptions — for every project entry that has a repo_url pointing
     to github.com, fetches the current "About" description from the API and
     updates the YAML field if it differs.

Uses ruamel.yaml for round-trip parsing that preserves comments, ordering,
and formatting.

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
    from ruamel.yaml.comments import CommentedMap
except ImportError:
    print("ERROR: ruamel.yaml is required. Install with: pip install ruamel.yaml")
    sys.exit(1)

YAML_PATH = "public/data/tyler-procko.yaml"
GITHUB_USER = "PR0CK0"
TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO_RE = re.compile(r"https://github\.com/([^/]+)/([^/\s]+?)/?$")


def gh_get(path: str) -> dict | list | None:
    """GET from the GitHub API. Returns parsed JSON or None on error."""
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
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} for {path}")
        return None
    except Exception as e:
        print(f"  Error fetching {path}: {e}")
        return None


def fetch_all_repos() -> list[dict]:
    """Return all public, non-forked repos for GITHUB_USER (paginated)."""
    repos: list[dict] = []
    page = 1
    while True:
        batch = gh_get(f"/users/{GITHUB_USER}/repos?type=public&per_page=100&page={page}")
        if not batch:
            break
        repos.extend(r for r in batch if not r.get("fork"))
        if len(batch) < 100:
            break
        page += 1
        time.sleep(0.2)
    return repos


def repo_slug(name: str) -> str:
    """Convert a repo name to a YAML id slug, e.g. 'MyRepo-Foo' → 'my-repo-foo'."""
    s = re.sub(r"[_\s]+", "-", name)
    return s.lower()


def repo_title(name: str) -> str:
    """Human-readable title from repo name, e.g. 'MyRepoFoo' → 'MyRepoFoo'."""
    # Replace underscores/hyphens with spaces, then title-case each word
    return re.sub(r"[-_]+", " ", name).strip()


def make_skeleton(repo: dict) -> CommentedMap:
    """Build a minimal project entry from a GitHub repo object."""
    entry = CommentedMap()
    entry["id"] = f"proj/{repo_slug(repo['name'])}"
    entry["title"] = repo_title(repo["name"])
    # year from pushed_at (YYYY-MM), fallback to created_at
    date_str = repo.get("pushed_at") or repo.get("created_at") or ""
    entry["year"] = date_str[:7] if date_str else ""
    entry["repo_url"] = repo["html_url"]
    if repo.get("description"):
        entry["description"] = repo["description"]
    return entry


def normalize_url(url: str) -> str:
    return (url or "").strip().rstrip("/").lower()


def main() -> None:
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = 120

    with open(YAML_PATH, encoding="utf-8") as f:
        data = yaml.load(f)

    projects = data.get("projects") or []
    changes = 0

    # ── Pass 1: auto-discover new repos ──────────────────────────────────────
    print("=== Pass 1: discovering new repos ===")
    existing_urls = {
        normalize_url(p.get("repo_url", ""))
        for p in projects
        if p.get("repo_url")
    }

    gh_repos = fetch_all_repos()
    print(f"Found {len(gh_repos)} public non-fork repos on GitHub")

    added = 0
    for repo in gh_repos:
        url = normalize_url(repo["html_url"])
        if url in existing_urls:
            continue
        skeleton = make_skeleton(repo)
        print(f"  NEW: {skeleton['id']} — {repo['html_url']}")
        projects.append(skeleton)
        existing_urls.add(url)
        added += 1
        changes += 1
        time.sleep(0.1)

    if added:
        print(f"Added {added} new project(s)")
    else:
        print("No new repos found")

    # ── Pass 2: sync descriptions ─────────────────────────────────────────────
    print("\n=== Pass 2: syncing descriptions ===")
    for project in projects:
        repo_url = (project.get("repo_url") or "").strip().rstrip("/")
        if "github.com" not in repo_url:
            continue

        m = REPO_RE.match(repo_url)
        if not m:
            continue
        owner, repo = m.group(1), m.group(2)

        print(f"Checking {owner}/{repo} ...", end=" ", flush=True)
        api_data = gh_get(f"/repos/{owner}/{repo}")
        time.sleep(0.2)

        if not api_data:
            print("(API error — skipped)")
            continue

        gh_desc = (api_data.get("description") or "").strip()
        if not gh_desc:
            print("(no description — skipped)")
            continue

        current = (project.get("description") or "").strip()
        if current == gh_desc:
            print("up to date")
            continue

        print(f"UPDATED\n  was: {current[:80]!r}\n  now: {gh_desc[:80]!r}")
        project["description"] = gh_desc
        changes += 1

    # ── Write if anything changed ─────────────────────────────────────────────
    if changes:
        with open(YAML_PATH, "w", encoding="utf-8") as f:
            yaml.dump(data, f)
        print(f"\n✓ {changes} change(s) written to {YAML_PATH}")
    else:
        print("\nNo changes needed.")


if __name__ == "__main__":
    main()
