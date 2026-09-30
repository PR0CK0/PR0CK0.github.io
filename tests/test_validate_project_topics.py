import importlib.util
from pathlib import Path

import pytest


SCRIPT_PATH = Path(__file__).parents[1] / ".github" / "scripts" / "validate_project_topics.py"
SPEC = importlib.util.spec_from_file_location("validate_project_topics", SCRIPT_PATH)
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


def test_new_github_repositories_are_detected_by_repo_url():
    before = [{"repo_url": "https://github.com/owner/existing"}]
    after = before + [
        {"repo_url": "https://github.com/owner/new-repo"},
        {"repo_url": "https://example.com/not-github"},
    ]

    assert validator.new_github_repositories(before, after) == ["owner/new-repo"]


def test_zero_topics_fails_for_new_repository():
    with pytest.raises(validator.TopicValidationError, match="zero GitHub topics"):
        validator.validate_topics(["owner/new-repo"], lambda _repo: [])


def test_nonempty_topics_pass_for_new_repository():
    validator.validate_topics(["owner/new-repo"], lambda _repo: ["wikidata"])


def test_no_new_github_repositories_passes_without_api_calls():
    def unexpected_call(_repo):
        raise AssertionError("no topic lookup should be needed")

    validator.validate_topics([], unexpected_call)
