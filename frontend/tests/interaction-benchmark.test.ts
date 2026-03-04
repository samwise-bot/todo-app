import { describe, expect, test } from 'vitest';
import { benchmarkBoardLaneAssembly } from '../lib/interaction-benchmark';

describe('benchmarkBoardLaneAssembly', () => {
  test('reports deterministic latency summary for board lane assembly', () => {
    const boards = [{ id: 1, name: 'TODO App Board' }];
    const columns = [
      { id: 11, boardId: 1, name: 'Inbox' },
      { id: 12, boardId: 1, name: 'Next' },
      { id: 13, boardId: 1, name: 'In Progress' }
    ];

    const tasks = Array.from({ length: 400 }).map((_, index) => ({
      id: index + 1,
      title: `Task ${index + 1}`,
      state: index % 3 === 0 ? 'next' : index % 3 === 1 ? 'scheduled' : 'inbox',
      boardColumnId: index % 3 === 0 ? 12 : index % 3 === 1 ? 13 : 11,
      priority: (index % 3) + 1,
      dueAt: index % 4 === 0 ? `2030-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00Z` : undefined
    }));

    const summary = benchmarkBoardLaneAssembly({ boards, columns, tasks, iterations: 25 });

    expect(summary.iterations).toBe(25);
    expect(summary.taskCount).toBe(400);
    expect(summary.durationsMs).toHaveLength(25);
    expect(summary.p50Ms).toBeGreaterThanOrEqual(0);
    expect(summary.p95Ms).toBeGreaterThanOrEqual(summary.p50Ms);
    expect(summary.maxMs).toBeGreaterThanOrEqual(summary.p95Ms);
    expect(summary.avgMs).toBeGreaterThanOrEqual(0);
  });
});
