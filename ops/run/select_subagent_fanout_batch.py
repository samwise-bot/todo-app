#!/usr/bin/env python3
"""Fetch live tasks from API, then select deterministic worker batch.

This wires plan_subagent_fanout.py into the autonomous loop runtime path:
- exports current tasks payload to .run/tasks.json
- runs deterministic batch selection with cursor persistence
- optionally emits compact subagent spawn specs with tuned timeout values
"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from urllib.request import urlopen

DEFAULT_API_BASE = 'http://localhost:8080'
DEFAULT_TASKS_PATH = Path('.run/tasks.json')
DEFAULT_CURSOR_PATH = Path('.run/subagent-fanout-cursor.json')
DEFAULT_BATCH_SIZE = 5
DEFAULT_WORKER_TIMEOUT_SECONDS = 180


def fetch_tasks(api_base: str, project_id: int | None = None) -> dict:
    base = api_base.rstrip('/')
    page = 1
    all_items: list[dict] = []
    page_size = 100
    total_pages = 1

    while page <= total_pages:
        with urlopen(f"{base}/api/tasks?page={page}&pageSize={page_size}") as resp:
            payload = json.loads(resp.read().decode('utf-8'))
        all_items.extend(payload.get('items', []))
        total_pages = int(payload.get('totalPages', 1))
        page += 1

    if project_id is not None:
        all_items = [t for t in all_items if int(t.get('projectId', -1)) == project_id]

    return {
        'items': all_items,
        'page': 1,
        'pageSize': len(all_items),
        'totalItems': len(all_items),
        'totalPages': 1,
    }


def _build_worker_prompt(task_id: int, title: str, repo_root: str) -> str:
    return (
        f'In {repo_root}, analyze task #{task_id} "{title}". '
        'Return concise output only: (1) proposed files/diff summary, '
        '(2) minimal tests, (3) blockers/dependencies. '
        'No code changes required.'
    )


def main() -> int:
    parser = argparse.ArgumentParser(description='Export tasks + select next subagent fanout batch.')
    parser.add_argument('--api-base', default=DEFAULT_API_BASE)
    parser.add_argument('--tasks-json', type=Path, default=DEFAULT_TASKS_PATH)
    parser.add_argument('--cursor-path', type=Path, default=DEFAULT_CURSOR_PATH)
    parser.add_argument('--batch-size', type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument('--project-id', type=int, default=None, help='Restrict planning to a single project id')
    parser.add_argument('--emit-spawn-spec', action='store_true', help='Include compact sessions_spawn payloads')
    parser.add_argument('--worker-timeout-seconds', type=int, default=DEFAULT_WORKER_TIMEOUT_SECONDS)
    parser.add_argument('--worker-repo-root', default='/home/bot/.openclaw/workspace/todo-app')
    args = parser.parse_args()

    payload = fetch_tasks(args.api_base, project_id=args.project_id)
    args.tasks_json.parent.mkdir(parents=True, exist_ok=True)
    args.tasks_json.write_text(json.dumps(payload, indent=2) + '\n')

    cmd = [
        'python3',
        'ops/run/plan_subagent_fanout.py',
        '--tasks-json',
        str(args.tasks_json),
        '--cursor-path',
        str(args.cursor_path),
        '--batch-size',
        str(args.batch_size),
    ]
    proc = subprocess.run(cmd, check=False, capture_output=True, text=True)
    if proc.returncode != 0:
        raise SystemExit(proc.returncode)

    selection = json.loads(proc.stdout)
    if args.emit_spawn_spec:
        selection['spawnSpecs'] = [
            {
                'runtime': 'subagent',
                'mode': 'run',
                'runTimeoutSeconds': args.worker_timeout_seconds,
                'task': _build_worker_prompt(t['id'], t.get('title', ''), args.worker_repo_root),
            }
            for t in selection.get('selected', [])
        ]

    print(json.dumps(selection, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
