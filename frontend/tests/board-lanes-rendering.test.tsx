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
    expect(html).toContain('Open advanced controls in Settings');
    expect(html).toContain('/settings#advanced-controls');
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
    expect(html).toContain('Move left');
    expect(html).toContain('Move right');
    expect(html).toContain('Edit column');
    expect(html).toContain('Rename column Doing');
    expect(html).toContain('Delete column Doing');
    expect(html).toContain('Keyboard tip: use Tab to focus move buttons');
    expect(html).toContain('class="kanban-column-header"');
    expect(html).toContain('class="kanban-scroll-wrap"');
    expect(html).toContain('class="kanban-scroll-fade kanban-scroll-fade-left"');
    expect(html).toContain('class="kanban-scroll-fade kanban-scroll-fade-right"');
    expect(html).toContain('class="kanban-scroll-edge-label kanban-scroll-edge-label-left"');
    expect(html).toContain('class="kanban-scroll-edge-label kanban-scroll-edge-label-right"');
    expect(html).toContain('Scroll ↔');
    expect(html).toContain('Swipe lanes');
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
        boardFilter={{
          assigneeId: '2',
          projectId: '2',
          state: 'next,scheduled',
          priority: '2',
          dueWindow: '72',
          search: 'chips',
          assigneeOptions: [{ id: 2, label: 'Samwise' }],
          projectOptions: [{ id: 2, label: 'TODO App' }],
          resetHref: '/board',
          hiddenParams: [['principalPage', '2']],
          assigneeLabel: 'Samwise',
          assigneeClearHref: '/board?taskAssigneeId=',
          projectLabel: 'TODO App',
          projectClearHref: '/board?taskProjectId='
        }}
        activeFilterBadges={[
          { label: 'Assignee: Samwise', clearHref: '/?taskAssigneeId=' },
          { label: 'Priority: P2', clearHref: '/?taskPriority=' },
          { label: 'Due: 3d', clearHref: '/?taskDueWindow=' }
        ]}
      />
    );

    expect(html).toContain('aria-label="Board filter toolbar"');
    expect(html).toContain('class="board-scroll-shadow-cue-sensor"');
    expect(html).toContain('class="board-filter-toolbar board-filter-toolbar-shadow-cue"');
    expect(html).toContain('aria-label="Saved board views"');
    expect(html).toContain('Saved views:');
    expect(html).toContain('Assigned to me');
    expect(html).toContain('Priority P1');
    expect(html).toContain('Mobile sweep (3d)');
    expect(html).toContain('class="badge badge-saved-view"');
    expect(html).toContain('aria-label="Board filters"');
    expect(html).toContain('Filter board by assignee');
    expect(html).toContain('Search board cards');
    expect(html).toContain('Apply filters');
    expect(html).toContain('Clear all');
    expect(html).toContain('aria-label="One-tap filter reset chips"');
    expect(html).toContain('3 active');
    expect(html).toContain('Reset all ×');
    expect(html).toContain('Quick clear:');
    expect(html).toContain('Assignee: Samwise ×');
    expect(html).toContain('Project: TODO App ×');
    expect(html).toContain('Active filters:');
    expect(html).toContain('Assignee: Samwise ×');
    expect(html).toContain('Priority: P2 ×');
    expect(html).toContain('Due: 3d ×');
    expect(html).toContain('Clear Assignee: Samwise');
  });

  test('marks saved-view chip active when current board filters match preset', () => {
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
        boardFilter={{
          assigneeId: '2',
          projectId: '2',
          state: 'next,scheduled',
          priority: '',
          dueWindow: '',
          search: '',
          assigneeOptions: [{ id: 2, label: 'Samwise' }],
          projectOptions: [{ id: 2, label: 'TODO App' }],
          resetHref: '/board',
          hiddenParams: [],
          assigneeLabel: 'Samwise',
          assigneeClearHref: '/board?taskAssigneeId=',
          projectLabel: 'TODO App',
          projectClearHref: '/board?taskProjectId='
        }}
      />
    );

    expect(html).toContain('badge badge-saved-view badge-saved-view-active');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('Active: <strong>Assigned to me</strong> · One-click reset to all cards:');
    expect(html).toContain('Reset view ×');
    expect(html).toContain('Active saved view Assigned to me. One-click reset available');
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

  test('renders column move status announcement with persistent keyboard hint when provided', () => {
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
        columnMoveStatus={'Moved "Next" right. Keyboard tip: use Tab to focus move buttons, then press Enter or Space to reorder again.'}
      />
    );

    expect(html).toContain('Moved &quot;Next&quot; right. Keyboard tip: use Tab to focus move buttons, then press Enter or Space to reorder again.');
    expect(html).toContain('role="status"');
  });

  test('shows filtered empty-state CTA when active filters hide all board cards', () => {
    const html = renderToStaticMarkup(
      <BoardLanesSection
        laneView={{
          boards: [{ id: 1, name: 'TODO App Board', columns: [{ id: 2, name: 'Next', tasks: [] }] }],
          tasksWithoutColumn: [],
          fetchErrors: []
        }}
        boards={[{ id: 1, name: 'TODO App Board' }]}
        columns={[{ id: 2, boardId: 1, name: 'Next' }]}
        principals={[]}
        projects={[]}
        boardFilter={{
          assigneeId: '2',
          projectId: '',
          state: 'next,scheduled',
          priority: '',
          dueWindow: '',
          search: '',
          assigneeOptions: [{ id: 2, label: 'Samwise' }],
          projectOptions: [],
          resetHref: '/board',
          hiddenParams: [],
          assigneeLabel: 'Samwise',
          assigneeClearHref: '/board?taskAssigneeId=',
          projectLabel: '',
          projectClearHref: '/board?taskProjectId='
        }}
        activeFilterBadges={[{ label: 'Assignee: Samwise', clearHref: '/board?taskAssigneeId=' }]}
      />
    );

    expect(html).toContain('No cards match current filters');
    expect(html).toContain('Reset filters or adjust advanced controls');
    expect(html).toContain('1 active filter is hiding every card.');
    expect(html).toContain('Active diagnostics:');
    expect(html).toContain('aria-label="Filtered empty-state diagnostics"');
    expect(html).toContain('Clear Assignee: Samwise from empty-state diagnostics');
    expect(html).toContain('Clear filters');
    expect(html).toContain('Open advanced controls');
    expect(html).toContain('aria-label="Board filtered empty state"');
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
