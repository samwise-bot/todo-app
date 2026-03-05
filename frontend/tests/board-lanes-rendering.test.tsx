import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

import { BoardLanesSection } from '../app/ui/board-lanes-section';

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
        principals={[]}
        projects={[]}
      />
    );

    expect(html).toContain('Board lanes are incomplete due to data loading issues.');
    expect(html).toContain('Boards data is unavailable (HTTP 503).');
    expect(html).toContain('Every task is currently assigned to a board column.');
    expect(html).toContain('No boards yet. Create your first board to start planning.');
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
        principals={[]}
        projects={[]}
      />
    );

    expect(html).toContain('Add column');
    expect(html).toContain('No columns defined for this board yet.');
    expect(html).toContain('No tasks in this column.');
  });

  test('renders active filter summary badges when board filters are applied', () => {
    const html = renderToStaticMarkup(
      <BoardLanesSection
        laneView={{
          boards: [],
          tasksWithoutColumn: [],
          fetchErrors: []
        }}
        boards={[]}
        columns={[]}
        principals={[]}
        projects={[]}
        activeFilterBadges={['Assignee: Samwise', 'Priority: P2', 'Due: 3d']}
      />
    );

    expect(html).toContain('Active filters:');
    expect(html).toContain('Assignee: Samwise');
    expect(html).toContain('Priority: P2');
    expect(html).toContain('Due: 3d');
  });

  test('renders mixed assigned and unassigned tasks in their respective lanes', () => {
    const html = renderToStaticMarkup(
      <BoardLanesSection
        laneView={{
          boards: [
            {
              id: 2,
              name: 'Delivery',
              columns: [
                {
                  id: 21,
                  name: 'Doing',
                  tasks: [{ id: 201, title: 'Prepare release notes', state: 'next', assigneeId: null, projectId: null }]
                },
                {
                  id: 22,
                  name: 'Done',
                  tasks: [{ id: 202, title: 'Ship patch', state: 'done', assigneeId: null, projectId: null }]
                }
              ]
            }
          ],
          tasksWithoutColumn: [{ id: 101, title: 'Inbox triage', state: 'inbox', assigneeId: null, projectId: null }],
          fetchErrors: []
        }}
        boards={[{ id: 2, name: 'Delivery' }]}
        columns={[
          { id: 21, boardId: 2, name: 'Doing' },
          { id: 22, boardId: 2, name: 'Done' }
        ]}
        principals={[]}
        projects={[]}
      />
    );

    expect(html).toContain('Inbox without column');
    expect(html).toContain('Inbox triage');
    expect(html).toContain('Delivery');
    expect(html).toContain('Doing');
    expect(html).toContain('Done');
    expect(html).toContain('Prepare release notes');
    expect(html).toContain('Ship patch');
    expect(html).not.toContain('No tasks in this column.');
    expect(html).not.toContain('No boards yet.');
  });
});
