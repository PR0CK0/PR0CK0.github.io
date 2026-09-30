"""Require topics on GitHub repositories newly added to the project portfolio."""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

try:
    from ruamel.yaml import YAML
except ImportError:
    print("ERROR: ruamel.yaml is required. Install with: pip install ruamel.yaml")
    sys.exit(1)


class TopicValidationError(RuntimeError):
    """Raised when a new project repository has no topics or cannot be checked."""


GITHUB_REPO_URL = re.compile(r"^https?://(?:www\.)?github\.com/([^/]+)/([^/]+)/?$", re.I)


def github_repository(url: str) -> str | None:
    match = GITHUB_REPO_URL.match((url or "").strip().removesuffix(".git"))
    return f"{match.group(1)}/{match.group(2)}".lower() if match else None


def new_github_repositories(before: list[dict], after: list[dict]) -> list[str]:
    existing = {repo for item in before if (repo := github_repository(item.get("repo_url", "")))}
    added = {
        repo for item in after if (repo := github_repository(item.get("repo_url", "")))
    } - existing
    return sorted(added)


def validate_topics(repositories: list[str], get_topics) -> None:
    for repository in repositories:
        topics = get_topics(repository)
        if not topics:
            raise TopicValidationError(
                f"{repository} has zero GitHub topics; add at least one topic before merging."
            )


def load_projects(revision: str) -> list[dict]:
    content = subprocess.check_output(
        ["git", "show", f"{revision}:public/data/tyler-procko.yaml"], text=True
    )
    data = YAML(typ="safe").load(content) or {}
    return data.get("projects", []) or []


def get_topics(repository: str) -> list[str]:
    request = urllib.request.Request(
        f"https://api.github.com/repos/{repository}/topics",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read()).get("names", [])
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as error:
        raise TopicValidationError(f"Could not verify topics for {repository}: {error}") from error


def main() -> int:
    base = os.environ["BASE_SHA"]
    head = os.environ["HEAD_SHA"]
    repositories = new_github_repositories(load_projects(base), load_projects(head))
    try:
        validate_topics(repositories, get_topics)
    except TopicValidationError as error:
        print(f"ERROR: {error}")
        return 1
    print(f"Validated topics for {len(repositories)} newly added GitHub project(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
