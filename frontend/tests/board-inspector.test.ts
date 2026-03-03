import { describe, expect, it } from 'vitest';

import { buildBoardInspectorMetrics } from '../lib/board-inspector';

describe('buildBoardInspectorMetrics', () => {
  it('counts queue, blocked, in-progress, unassigned, and overdue tasks', () => {
    const metrics = buildBoardInspectorMetrics(
      [
        { state: 'next', assigneeId: 2, dueAt: '2026-03-03T20:00:00Z' },
        { state: 'scheduled', assigneeId: 2 },
        { state: 'waiting', assigneeId: null, dueAt: '2026-03-03T18:00:00Z' },
        { state: 'done', assigneeId: null, dueAt: '2026-03-03T18:00:00Z' },
        { state: 'inbox', assigneeId: undefined, dueAt: 'invalid-date' }
      ],
      new Date('2026-03-03T21:00:00Z')
    );

    expect(metrics).toEqual({
      nextCount: 1,
      inProgressCount: 1,
      blockedCount: 1,
      unassignedCount: 3,
      overdueCount: 2
    });
  });
});
