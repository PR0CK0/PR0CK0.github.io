"""Reconcile tracked public repositories without changing portfolio identity."""

from __future__ import annotations

from urllib.parse import urlsplit


def github_repository(url: str) -> str | None:
    parsed = urlsplit((url or '').strip())
    parts = parsed.path.strip('/').split('/')
    if parsed.scheme not in ('https', 'http') or parsed.hostname not in ('github.com', 'www.github.com') or len(parts) != 2 or not all(parts):
        return None
    return '/'.join(parts).removesuffix('.git').lower()


def reconcile_repositories(data: dict, fetch, *, sync_descriptions: bool = False) -> int:
    """Resolve IDs before discovery; abort on uncertainty rather than invent matches."""
    changes = 0
    cache = {}
    for section, url_field in [('projects', 'repo_url'), ('extracurriculars', 'url')]:
        for record in data.get(section) or []:
            repository = github_repository(record.get(url_field, ''))
            if not repository:
                continue
            stored_id = record.get('github_repo_id')
            path = f'/repositories/{stored_id}' if stored_id else f'/repos/{repository}'
            if path not in cache:
                cache[path] = fetch(path)
            repo = cache[path]
            if (not isinstance(repo, dict) or type(repo.get('id')) is not int or repo['id'] <= 0
                    or repo.get('private') is not False or not github_repository(repo.get('html_url', ''))
                    or (stored_id is not None and stored_id != repo['id'])):
                raise RuntimeError(f'Cannot safely resolve {record["id"]} ({path}); no file written. Check repository access/identity.')

            updates = {'github_repo_id': repo['id'], url_field: repo['html_url']}
            if section == 'projects':
                if github_repository(record.get('url', '')) == repository:
                    updates['url'] = repo['html_url']
                description = (repo.get('description') or '').strip()
                if sync_descriptions and description and description != (record.get('description') or '').strip():
                    updates['description'] = repo['description']
            changed = [field for field, value in updates.items() if record.get(field) != value]
            if changed:
                record.update(updates)
                changes += 1
                print(f'  UPDATED {record["id"]}: {", ".join(changed)}')
    return changes
