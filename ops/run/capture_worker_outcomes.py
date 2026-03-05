#!/usr/bin/env python3
"""Capture a live worker-outcome artifact using local command execution.

This is a non-subagent fallback path for environments where worker spawning is
restricted. It executes deterministic local commands with timeout enforcement and
writes `.run/subagent-worker-results.json` for sweep/threshold analysis.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_OUTPUT_PATH = Path('.run/subagent-worker-results.json')


def _run_case(task_id: int, command: str, timeout_seconds: int) -> dict:
    started = time.monotonic()
    started_at = datetime.now(timezone.utc).isoformat()
    status = 'completed'
    timed_out = False

    try:
        proc = subprocess.run(
            command,
            shell=True,
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
        exit_code = proc.returncode
    except subprocess.TimeoutExpired:
        status = 'timed_out'
        timed_out = True
        exit_code = None

    duration_seconds = round(time.monotonic() - started, 3)
    finished_at = datetime.now(timezone.utc).isoformat()

    return {
        'taskId': task_id,
        'status': status,
        'durationSeconds': duration_seconds,
        'timedOut': timed_out,
        'timeoutSeconds': timeout_seconds,
        'command': command,
        'exitCode': exit_code,
        'startedAt': started_at,
        'finishedAt': finished_at,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description='Capture local worker outcome artifact.')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument('--timeout-seconds', type=int, default=2)
    parser.add_argument('--success-cases', type=int, default=2)
    parser.add_argument('--timeout-cases', type=int, default=1)
    args = parser.parse_args()

    rows: list[dict] = []
    next_task_id = 9100

    for _ in range(max(0, args.success_cases)):
        rows.append(_run_case(next_task_id, 'python3 -c "import time; time.sleep(0.2)"', args.timeout_seconds))
        next_task_id += 1

    for _ in range(max(0, args.timeout_cases)):
        rows.append(_run_case(next_task_id, 'python3 -c "import time; time.sleep(5)"', args.timeout_seconds))
        next_task_id += 1

    payload = {
        'capturedAt': datetime.now(timezone.utc).isoformat(),
        'source': 'local-timeout-harness',
        'timeoutSeconds': args.timeout_seconds,
        'items': rows,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2) + '\n')
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
