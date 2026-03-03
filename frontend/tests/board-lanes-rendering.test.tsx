import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

import { BoardLanesSection } from '../app/page';

describe('BoardLanesSection', () => {
  test('renders board-lane error banner and global empty fallbacks', () => {
    const html = renderToStaticMarkup(
      <BoardLanesSection
        laneView={{
          boards: [],
          tasksWithoutColumn: [],
          fetchErrors: ['Boards data is unavailable (HTTP 503).']
        }}
        boards={[]}
        columns={[]}
      />
    );

    expect(html).toContain('Board lanes are incomplete due to data loading errors.');
    expect(html).toContain('Boards data is unavailable (HTTP 503).');
    expect(html).toContain('No tasks without a board column.');
    expect(html).toContain('No boards yet.');
  });

  test('renders board-level and column-level empty states', () => {
    const html = renderToStaticMarkup(
      <BoardLanesSection
        laneView={{
          boards: [
            { id: 1, name: 'Execution', columns: [] },
            {
              id: 2,
              name: 'Delivery',
              columns: [{ id: 21, name: 'Doing', tasks: [] }]
            }
          ],
          tasksWithoutColumn: [],
          fetchErrors: []
        }}
        boards={[
          { id: 1, name: 'Execution' },
          { id: 2, name: 'Delivery' }
        ]}
        columns={[{ id: 21, boardId: 2, name: 'Doing' }]}
      />
    );

    expect(html).toContain('No columns defined for this board.');
    expect(html).toContain('No tasks in this column.');
    expect(html).toContain('Tasks appear in board lanes only when assigned to a board column.');
  });
});
