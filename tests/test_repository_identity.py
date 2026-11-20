"""Repository identity survives renames, transfers, and reuse of old names."""

import copy
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ruamel.yaml import YAML

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.github' / 'scripts'))
import repository_identity as identity
import discover_new_repos as discovery
import sync_repo_descriptions as sync
import validate_project_topics as topics


REPO = {'id': 42, 'name': 'renamed', 'html_url': 'https://github.com/new-owner/renamed',
        'private': False, 'owner': {'login': 'new-owner'}, 'description': 'Current About text'}
PROJECT = {'id': 'proj/original', 'title': 'My curated title', 'github_repo_id': 42,
           'repo_url': 'https://github.com/owner/original', 'description': 'Authored text',
           'page': {'slug': 'stable-page', 'sections': [{'heading': 'Notes', 'paragraphs': ['Keep me.']}]}}


class RepositoryIdentityTests(unittest.TestCase):
    def test_repository_urls_are_normalized_without_matching_subpages_or_other_hosts(self):
        self.assertEqual(identity.github_repository(' https://GitHub.com/Owner/Repo.git/ '), 'owner/repo')
        self.assertEqual(identity.github_repository('https://github.com/owner/repo?tab=readme'), 'owner/repo')
        self.assertIsNone(identity.github_repository('https://github.com/owner/repo/pull/1'))
        self.assertIsNone(identity.github_repository('https://github.com.example.org/owner/repo'))

    def test_rename_uses_id_and_preserves_authored_content_and_page_address(self):
        project = copy.deepcopy(PROJECT)
        project['url'] = project['repo_url']
        calls = []
        def fetch(path):
            calls.append(path)
            return REPO
        self.assertEqual(identity.reconcile_repositories({'projects': [project]}, fetch), 1)
        self.assertEqual(calls, ['/repositories/42'])
        self.assertEqual(project['repo_url'], REPO['html_url'])
        self.assertEqual(project['url'], REPO['html_url'])
        for field in ['id', 'title', 'description', 'page']:
            self.assertEqual(project[field], PROJECT[field])
        self.assertEqual(identity.reconcile_repositories({'projects': [project]}, fetch), 0)

    def test_backfill_follows_old_url_and_preserves_distinct_website(self):
        project = copy.deepcopy(PROJECT)
        del project['github_repo_id']
        project['url'] = 'https://example.org'
        calls = []
        def fetch(path):
            calls.append(path)
            return REPO
        identity.reconcile_repositories({'projects': [project]}, fetch)
        self.assertEqual(calls, ['/repos/owner/original'])
        self.assertEqual(project['github_repo_id'], 42)
        self.assertEqual(project['url'], 'https://example.org')

    def test_description_sync_also_repairs_identity_without_an_about_description(self):
        project = copy.deepcopy(PROJECT)
        identity.reconcile_repositories({'projects': [project]}, lambda path: {**REPO, 'description': None}, sync_descriptions=True)
        self.assertEqual(project['repo_url'], REPO['html_url'])
        self.assertEqual(project['description'], PROJECT['description'])
        identity.reconcile_repositories({'projects': [project]}, lambda path: REPO, sync_descriptions=True)
        self.assertEqual(project['description'], REPO['description'])

    def test_unavailable_private_or_wrong_id_fails_without_writing_the_file(self):
        for result in [None, {**REPO, 'private': True}, {**REPO, 'id': 99}]:
            with self.subTest(result=result), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'portfolio.yaml'
                YAML().dump({'projects': [PROJECT]}, path)
                original = path.read_bytes()
                with patch.object(sync, 'YAML_PATH', path), patch.object(sync, 'gh_get', return_value=result):
                    with self.assertRaises(RuntimeError):
                        sync.main()
                self.assertEqual(path.read_bytes(), original)

    def run_discovery(self, data, repositories, response=REPO):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'portfolio.yaml'
            YAML().dump(data, path)
            with patch.dict('os.environ', {'GITHUB_REPOSITORY': 'owner/site'}), \
                 patch.object(discovery, 'YAML_PATH', path), \
                 patch.object(discovery, 'GITHUB_USERS', ['owner']), \
                 patch.object(discovery, 'has_open_discovery_pr', return_value=False), \
                 patch.object(discovery, 'fetch_all_repos', return_value=repositories), \
                 patch.object(discovery, 'gh_get', return_value=response), \
                 patch.object(discovery, 'infer_technologies', return_value=[]), \
                 patch.object(discovery.time, 'sleep'):
                discovery.main()
            return YAML(typ='safe').load(path)

    def test_discovery_repairs_rename_without_adding_a_duplicate_before_sync(self):
        project = copy.deepcopy(PROJECT)
        del project['github_repo_id']
        data = self.run_discovery({'projects': [project]}, [REPO])
        self.assertEqual(len(data['projects']), 1)
        self.assertEqual(data['projects'][0]['id'], PROJECT['id'])
        self.assertEqual(data['projects'][0]['github_repo_id'], 42)
        self.assertEqual(data['projects'][0]['repo_url'], REPO['html_url'])

    def test_reusing_old_name_is_a_different_repository_and_gets_a_unique_project_id(self):
        reused = {**REPO, 'id': 99, 'name': 'original', 'html_url': PROJECT['repo_url']}
        data = self.run_discovery({'projects': [PROJECT]}, [REPO, reused])
        projects = data['projects']
        self.assertEqual(len(projects), 2)
        self.assertEqual({project['github_repo_id'] for project in projects}, {42, 99})
        self.assertEqual(len({project['id'] for project in projects}), 2)

    def test_extracurricular_repo_is_not_rediscovered_after_a_rename(self):
        extra = {'id': 'extra/example', 'title': 'Contribution', 'url': PROJECT['repo_url']}
        data = self.run_discovery({'projects': [], 'extracurriculars': [extra]}, [REPO])
        self.assertEqual(data['projects'], [])
        self.assertEqual(data['extracurriculars'][0]['github_repo_id'], 42)

    def test_topic_validation_does_not_treat_a_rename_as_a_new_repository(self):
        renamed = {**PROJECT, 'repo_url': REPO['html_url']}
        self.assertEqual(topics.new_github_repositories([PROJECT], [renamed]), [])
        replaced = {**renamed, 'github_repo_id': 99}
        self.assertEqual(topics.new_github_repositories([PROJECT], [replaced]), ['new-owner/renamed'])
        reused = {**PROJECT, 'github_repo_id': 99}
        self.assertEqual(topics.new_github_repositories([PROJECT], [reused]), ['owner/original'])

    def test_failed_listing_does_not_silently_look_like_no_repositories(self):
        with patch.object(discovery, 'gh_get', return_value=None):
            with self.assertRaisesRegex(RuntimeError, 'Could not list repositories'):
                discovery.fetch_all_repos('owner')


if __name__ == '__main__':
    unittest.main()
