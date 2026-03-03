import { describe, expect, test } from 'vitest';
import { buildBoardLaneView } from '../lib/board-lanes';

describe('buildBoardLaneView', () => {
  test('surfaces fetch errors and lane empty states explicitly', () => {
    const view = buildBoardLaneView({
      boards: [{ id: 1, name: 'Execution' }],
      columns: [{ id: 11, boardId: 1, name: 'Doing' }],
      tasks: [],
      fetchErrors: ['Boards data is unavailable (HTTP 503).']
    });

    expect(view.fetchErrors).toEqual(['Boards data is unavailable (HTTP 503).']);
    expect(view.tasksWithoutColumn).toEqual([]);
    expect(view.boards).toHaveLength(1);
    expect(view.boards[0].columns).toHaveLength(1);
    expect(view.boards[0].columns[0].tasks).toEqual([]);
  });

  test('routes tasks with missing/unknown board column into no-column lane', () => {
    const view = buildBoardLaneView({
      boards: [{ id: 1, name: 'Execution' }],
      columns: [{ id: 11, boardId: 1, name: 'Doing' }],
      tasks: [
        { id: 101, title: 'No assignment', state: 'inbox' },
        { id: 102, title: 'Unknown lane', state: 'next', boardColumnId: 999 },
        { id: 103, title: 'Assigned', state: 'next', boardColumnId: 11 }
      ],
      fetchErrors: []
    });

    expect(view.tasksWithoutColumn.map((task) => task.id)).toEqual([101, 102]);
    expect(view.boards[0].columns[0].tasks.map((task) => task.id)).toEqual([103]);
  });
});

