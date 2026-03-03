#!/usr/bin/env python3
"""Plan deterministic batched worker fanout for Next tasks.

Reads a tasks payload (from API export), sorts by priority+deadline, and selects the
next batch using a persisted cursor so autonomous loops can resume across cycles.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_BATCH_SIZE = 5
DEFAULT_CURSOR_PATH = Path('.run/subagent-fanout-cursor.json')


@dataclass(frozen=True)
class TaskRef:
    id: int
    title: str
    priority: int
    due_at: str | None


def _parse_iso(value: str | None) -> datetime:
    if not value:
        return datetime.max.replace(tzinfo=timezone.utc)
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


def _load_items(tasks_json_path: Path) -> list[dict[str, Any]]:
    payload = json.loads(tasks_json_path.read_text())
    if isinstance(payload, dict):
        return payload.get('items', [])
    if isinstance(payload, list):
        return payload
    raise ValueError('Unsupported tasks payload format')


def select_next_batch(items: list[dict[str, Any]], start_cursor: int, batch_size: int) -> tuple[list[TaskRef], int]:
    eligible = [
        TaskRef(
            id=int(t['id']),
            title=t.get('title', ''),
            priority=int(t.get('priority', 3)),
            due_at=t.get('dueAt'),
        )
        for t in items
        if t.get('state') == 'next'
    ]
    ordered = sorted(eligible, key=lambda t: (t.priority, _parse_iso(t.due_at), t.id))
    if not ordered:
        return [], 0

    cursor = start_cursor % len(ordered)
    end = min(cursor + batch_size, len(ordered))
    batch = ordered[cursor:end]

    next_cursor = 0 if end >= len(ordered) else end
    return batch, next_cursor


def load_cursor(cursor_path: Path) -> int:
    if not cursor_path.exists():
        return 0
    try:
        data = json.loads(cursor_path.read_text())
        return int(data.get('cursor', 0))
    except Exception:
        return 0


def save_cursor(cursor_path: Path, cursor: int) -> None:
    cursor_path.parent.mkdir(parents=True, exist_ok=True)
    cursor_path.write_text(json.dumps({'cursor': cursor}, indent=2) + '\n')


def main() -> int:
    parser = argparse.ArgumentParser(description='Plan batched subagent fanout for Next tasks.')
    parser.add_argument('--tasks-json', required=True, type=Path, help='Path to tasks JSON payload')
    parser.add_argument('--batch-size', type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument('--cursor-path', type=Path, default=DEFAULT_CURSOR_PATH)
    args = parser.parse_args()

    items = _load_items(args.tasks_json)
    current_cursor = load_cursor(args.cursor_path)
    batch, next_cursor = select_next_batch(items, current_cursor, args.batch_size)
    save_cursor(args.cursor_path, next_cursor)

    print(json.dumps({
        'cursorStart': current_cursor,
        'cursorNext': next_cursor,
        'batchSize': args.batch_size,
        'selected': [
            {'id': t.id, 'title': t.title, 'priority': t.priority, 'dueAt': t.due_at}
            for t in batch
        ],
    }, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
