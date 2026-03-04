#!/usr/bin/env python3
"""Validate that deterministic fanout selection covers the full Next queue.

Runs select_subagent_fanout_batch.py repeatedly (without spawning workers)
until every current Next task id has appeared at least once, then writes a
metrics report for unblock task #38.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_API_BASE = "http://localhost:8080"
DEFAULT_PROJECT_ID = 2
DEFAULT_BATCH_SIZE = 5
DEFAULT_MAX_CYCLES = 20
DEFAULT_REPORT_PATH = Path('.run/subagent-fanout-sweep-report.json')
DEFAULT_WORKER_RESULTS_PATH = Path('.run/subagent-worker-results.json')
DEFAULT_WORKER_RESULTS_FIXTURE_PATH = Path('ops/fixtures/subagent-worker-results.sample.json')


def _run_select(api_base: str, project_id: int, batch_size: int) -> dict:
    cmd = [
        'python3',
        'ops/run/select_subagent_fanout_batch.py',
        '--api-base',
        api_base,
        '--project-id',
        str(project_id),
        '--batch-size',
        str(batch_size),
        '--emit-spawn-spec',
    ]
    proc = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return json.loads(proc.stdout)


def _next_ids_from_tasks_json(path: Path) -> list[int]:
    payload = json.loads(path.read_text())
    if isinstance(payload, dict):
        items = payload.get('items') or payload.get('data') or []
    else:
        items = payload

    next_ids: set[int] = set()
    for task in items:
        if not isinstance(task, dict):
            continue
        if task.get('state') != 'next':
            continue
        task_id = task.get('id')
        if task_id is None:
            continue
        next_ids.add(int(task_id))

    return sorted(next_ids)


def _worker_outcome_summary(path: Path, fixture_path: Path | None = None) -> dict:
    source_path = path
    used_fixture = False

    if not source_path.exists() and fixture_path and fixture_path.exists():
        source_path = fixture_path
        used_fixture = True

    if not source_path.exists():
        return {
            'path': str(path),
            'found': False,
            'usedFixture': False,
            'total': 0,
            'completed': 0,
            'timedOut': 0,
            'completionRatio': 0.0,
            'timeoutRatio': 0.0,
        }

    payload = json.loads(source_path.read_text())
    rows = payload.get('items', []) if isinstance(payload, dict) else payload
    completed = 0
    timed_out = 0
    for row in rows:
        if not isinstance(row, dict):
            continue
        status = str(row.get('status', '')).lower()
        if status in {'completed', 'done', 'success'}:
            completed += 1
        if status in {'timed_out', 'timeout', 'timedout'}:
            timed_out += 1

    total = len([r for r in rows if isinstance(r, dict)])
    return {
        'path': str(source_path),
        'requestedPath': str(path),
        'found': True,
        'usedFixture': used_fixture,
        'total': total,
        'completed': completed,
        'timedOut': timed_out,
        'completionRatio': (completed / total) if total else 0.0,
        'timeoutRatio': (timed_out / total) if total else 0.0,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description='Validate fanout coverage over full Next queue.')
    parser.add_argument('--api-base', default=DEFAULT_API_BASE)
    parser.add_argument('--project-id', type=int, default=DEFAULT_PROJECT_ID)
    parser.add_argument('--batch-size', type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument('--max-cycles', type=int, default=DEFAULT_MAX_CYCLES)
    parser.add_argument('--tasks-json', type=Path, default=Path('.run/tasks.json'))
    parser.add_argument('--worker-results-json', type=Path, default=DEFAULT_WORKER_RESULTS_PATH)
    parser.add_argument('--worker-results-fixture-json', type=Path, default=DEFAULT_WORKER_RESULTS_FIXTURE_PATH)
    parser.add_argument('--report-path', type=Path, default=DEFAULT_REPORT_PATH)
    args = parser.parse_args()

    seen: set[int] = set()
    cycle_summaries: list[dict] = []

    final_expected: list[int] = []
    for cycle in range(1, args.max_cycles + 1):
        out = _run_select(args.api_base, args.project_id, args.batch_size)
        selected_ids = [int(t['id']) for t in out.get('selected', [])]
        seen.update(selected_ids)

        expected_ids = _next_ids_from_tasks_json(args.tasks_json)
        final_expected = expected_ids
        missing = sorted(set(expected_ids) - seen)

        cycle_summaries.append({
            'cycle': cycle,
            'cursorStart': out.get('cursorStart'),
            'cursorNext': out.get('cursorNext'),
            'selectedIds': selected_ids,
            'expectedNextIds': expected_ids,
            'missingAfterCycle': missing,
        })

        if not missing:
            break

    completed = not bool(sorted(set(final_expected) - seen))
    report = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'apiBase': args.api_base,
        'projectId': args.project_id,
        'batchSize': args.batch_size,
        'maxCycles': args.max_cycles,
        'cyclesRun': len(cycle_summaries),
        'expectedNextIds': final_expected,
        'seenIds': sorted(seen),
        'coverageRatio': (len(set(final_expected) & seen) / len(final_expected)) if final_expected else 1.0,
        'completedFullSweep': completed,
        'workerOutcomeSummary': _worker_outcome_summary(
            args.worker_results_json,
            fixture_path=args.worker_results_fixture_json,
        ),
        'cycleSummaries': cycle_summaries,
    }

    args.report_path.parent.mkdir(parents=True, exist_ok=True)
    args.report_path.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))

    return 0 if completed else 2


if __name__ == '__main__':
    raise SystemExit(main())
