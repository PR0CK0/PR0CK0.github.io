import os
import subprocess
from pathlib import Path

import pytest
from ruamel.yaml import YAML


WORKFLOW = Path(__file__).parents[1] / '.github/workflows/sync-repo-descriptions.yml'


@pytest.fixture
def run_publish(tmp_path):
    workflow = YAML(typ='safe').load(WORKFLOW.read_text())
    script = next(step['run'] for step in workflow['jobs']['sync']['steps']
                  if 'git diff --quiet' in step.get('run', ''))
    commands = tmp_path / 'commands.log'
    stub = '''#!/bin/sh
printf '%s %s\\n' "${0##*/}" "$*" >> "$COMMAND_LOG"
if [ "$1" = diff ]; then exit "${HAS_CHANGES:-1}"; fi
if [ "$1" = push ] && [ "${FAIL_PUSH:-0}" = 1 ]; then exit 1; fi
if [ "$1 $2" = 'pr create' ]; then printf 'https://github.com/example/site/pull/1\\n'; fi
'''
    for name in ['git', 'gh']:
        executable = tmp_path / name
        executable.write_text(stub)
        executable.chmod(0o755)

    def run(**overrides):
        env = dict(os.environ, PATH=f'{tmp_path}{os.pathsep}{os.environ["PATH"]}',
                   COMMAND_LOG=str(commands), AUTOMATION_TOKEN='test-credential',
                   GH_TOKEN='test-credential', GITHUB_RUN_ID='12345')
        env.update(overrides)
        result = subprocess.run(['bash', '-e', '-o', 'pipefail', '-c', script],
                                cwd=tmp_path, env=env, capture_output=True, text=True)
        return result, commands.read_text().splitlines()
    return run


def test_changed_descriptions_use_a_checked_auto_merge_pr(run_publish):
    result, commands = run_publish()
    assert result.returncode == 0, result.stderr
    assert any(line.startswith('git push --set-upstream origin automation/') for line in commands)
    create = next(line for line in commands if line.startswith('gh pr create '))
    assert '--base main' in create
    merge = next(line for line in commands if line.startswith('gh pr merge '))
    assert '--auto' in merge and '--squash' in merge and '--admin' not in merge
    assert not any('[skip ci]' in line for line in commands)
    workflow = YAML(typ='safe').load(WORKFLOW.read_text())
    steps = workflow['jobs']['sync']['steps']
    checkout = next(step for step in steps if step.get('uses', '').startswith('actions/checkout@'))
    assert 'secrets.AUTOMATION_TOKEN' in checkout['with']['token']
    publish = next(step for step in steps if 'git diff --quiet' in step.get('run', ''))
    assert publish['env']['GH_TOKEN'] == '${{ secrets.AUTOMATION_TOKEN }}'


def test_unchanged_descriptions_do_not_push_or_open_pr(run_publish):
    result, commands = run_publish(HAS_CHANGES='0')
    assert result.returncode == 0
    assert not any(line.startswith(('git push', 'git commit', 'gh pr')) for line in commands)


def test_missing_automation_token_fails_before_publishing(run_publish):
    result, commands = run_publish(AUTOMATION_TOKEN='')
    assert result.returncode != 0
    assert 'AUTOMATION_TOKEN' in result.stderr
    assert not any(line.startswith(('git push', 'gh pr')) for line in commands)


def test_failed_push_does_not_create_or_merge_pr(run_publish):
    result, commands = run_publish(FAIL_PUSH='1')
    assert result.returncode != 0
    assert not any(line.startswith('gh pr') for line in commands)
