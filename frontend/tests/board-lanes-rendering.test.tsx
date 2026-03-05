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

  test('renders shareable preset links on the board panel', () => {
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
        presetLinks={[
          { key: 'my-active', label: 'My active', href: '/board?taskAssigneeId=2&taskState=next,scheduled' },
          { key: 'p1-work', label: 'P1 focus', href: '/board?taskPriority=1' }
        ]}
      />
    );

    expect(html).toContain('Shareable presets:');
    expect(html).toContain('My active');
    expect(html).toContain('/board?taskAssigneeId=2&amp;taskState=next,scheduled');
    expect(html).toContain('P1 focus');
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
        activeFilterBadges={[
          { label: 'Assignee: Samwise', clearHref: '/?taskAssigneeId=' },
          { label: 'Priority: P2', clearHref: '/?taskPriority=' },
          { label: 'Due: 3d', clearHref: '/?taskDueWindow=' }
        ]}
      />
    );

    expect(html).toContain('Active filters:');
    expect(html).toContain('Assignee: Samwise ×');
    expect(html).toContain('Priority: P2 ×');
    expect(html).toContain('Due: 3d ×');
    expect(html).toContain('Clear Assignee: Samwise');
  });

  test('renders column move rollback notice when provided', () => {
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
        columnMoveNotice={'Column move failed for "Next". Optimistic reorder was rolled back.'}
      />
    );

    expect(html).toContain('Column move failed for &quot;Next&quot;. Optimistic reorder was rolled back.');
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
    expect(html).toContain('Quick controls / Edit / Delete');
    expect(html).toContain('Set assignee for task 201');
    expect(html).toContain('Set project for task 202');
    expect(html).toContain('Set priority for task 202');
    expect(html).toContain('Delete task 201');
    expect(html).toContain('aria-label="Edit title for task 202"');
    expect(html).not.toContain('No tasks in this column.');
    expect(html).not.toContain('No boards yet.');
  });
});
