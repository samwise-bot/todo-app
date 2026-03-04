import { describe, expect, test } from 'vitest';

import { createAppStoreSnapshot } from '../lib/app-store';

describe('createAppStoreSnapshot', () => {
  test('indexes entities and sorts Next tasks by priority then dueAt then id', () => {
    const snapshot = createAppStoreSnapshot({
      tasks: [
        { id: 12, state: 'next', priority: 3, dueAt: '2026-03-07T10:00:00Z', assigneeId: 2 },
        { id: 8, state: 'next', priority: 2, dueAt: '2026-03-09T10:00:00Z', assigneeId: 2 },
        { id: 5, state: 'next', priority: 2, dueAt: '2026-03-05T10:00:00Z', assigneeId: 7 },
        { id: 9, state: 'in_progress', priority: 1, assigneeId: 2 },
        { id: 3, state: 'next', priority: 2, dueAt: '2026-03-05T10:00:00Z', assigneeId: 2 }
      ],
      boards: [{ id: 1 }],
      columns: [{ id: 2 }],
      principals: [{ id: 7 }]
    });

    expect(snapshot.tasksById.get(12)?.state).toBe('next');
    expect(snapshot.boardsById.has(1)).toBe(true);
    expect(snapshot.columnsById.has(2)).toBe(true);
    expect(snapshot.principalsById.has(7)).toBe(true);
    expect(snapshot.orderedNextTaskIds).toEqual([3, 5, 8, 12]);
    expect(snapshot.nextTaskIdsByAssignee.get(2)).toEqual([3, 8, 12]);
    expect(snapshot.nextTaskIdsByAssignee.get(7)).toEqual([5]);
  });
});
