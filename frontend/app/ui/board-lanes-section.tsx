import React from 'react';
import type { BoardLaneView } from '../../lib/board-lanes';
import {
  assignTaskAction,
  createColumnAction,
  createTaskAction,
  deleteColumnAction,
  deleteTaskAction,
  updateColumnAction,
  updateTaskAction
} from '../actions';
import { INITIAL_ACTION_STATE } from '../../lib/action-state';

type Entity = { id: number; name?: string; displayName?: string; [key: string]: unknown };

type BoardFilterOverrides = {
  assigneeId?: string;
  projectId?: string;
  state?: string;
  priority?: string;
  dueWindow?: string;
  search?: string;
};

type BoardFilterComparable = {
  assigneeId: string;
  projectId: string;
  state: string;
  priority: string;
  dueWindow: string;
  search: string;
};

function buildBoardFilterHref(
  boardHref: string,
  hiddenParams: [string, string][],
  overrides: BoardFilterOverrides
): string {
  const [basePath, existingQuery = ''] = boardHref.split('?');
  const params = new URLSearchParams(existingQuery);

  for (const [key, value] of hiddenParams) {
    params.set(key, value);
  }

  params.set('taskPage', '1');

  const mapping: Array<[keyof BoardFilterOverrides, string]> = [
    ['assigneeId', 'taskAssigneeId'],
    ['projectId', 'taskProjectId'],
    ['state', 'taskState'],
    ['priority', 'taskPriority'],
    ['dueWindow', 'taskDueWindow'],
    ['search', 'taskQ']
  ];

  for (const [sourceKey, queryKey] of mapping) {
    const value = overrides[sourceKey];
    if (value && value.trim() !== '') {
      params.set(queryKey, value);
    } else {
      params.delete(queryKey);
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function normalizeBoardFilterValue(value?: string): string {
  return (value ?? '').trim();
}

function resolveBoardFilterTarget(current: BoardFilterComparable, overrides: BoardFilterOverrides): BoardFilterComparable {
  return {
    assigneeId: normalizeBoardFilterValue(overrides.assigneeId ?? current.assigneeId),
    projectId: normalizeBoardFilterValue(overrides.projectId ?? current.projectId),
    state: normalizeBoardFilterValue(overrides.state ?? current.state),
    priority: normalizeBoardFilterValue(overrides.priority ?? current.priority),
    dueWindow: normalizeBoardFilterValue(overrides.dueWindow ?? current.dueWindow),
    search: normalizeBoardFilterValue(overrides.search ?? current.search)
  };
}

function isSavedViewActive(current: BoardFilterComparable, target: BoardFilterComparable): boolean {
  return (
    current.assigneeId === target.assigneeId &&
    current.projectId === target.projectId &&
    current.state === target.state &&
    current.priority === target.priority &&
    current.dueWindow === target.dueWindow &&
    current.search === target.search
  );
}

function TaskCard({
  task,
  principalName,
  projectName,
  principals,
  projects
}: {
  task: { id: number; title: string; description?: string; state: string; assigneeId?: number | null; projectId?: number | null; priority?: number | null; dueAt?: string | null };
  principalName: string;
  projectName: string;
  principals: Entity[];
  projects: Entity[];
}) {
  async function inlineUpdateTask(formData: FormData) {
    'use server';
    formData.set('taskId', String(task.id));
    await updateTaskAction(INITIAL_ACTION_STATE, formData);
  }

  async function inlineAssignTask(formData: FormData) {
    'use server';
    formData.set('taskId', String(task.id));
    await assignTaskAction(INITIAL_ACTION_STATE, formData);
  }

  async function inlineDeleteTask(formData: FormData) {
    'use server';
    formData.set('taskId', String(task.id));
    await deleteTaskAction(INITIAL_ACTION_STATE, formData);
  }

  const dueAtLocal = task.dueAt ? task.dueAt.slice(0, 16) : '';

  return (
    <article
      className="task-card"
      draggable
      data-task-id={task.id}
      data-task-state={task.state}
      aria-label={`Task ${task.title} draggable card`}
    >
      <h5>{task.title}</h5>
      <div className="badge-row">
        <span className="badge badge-state">{task.state}</span>
        <span className="badge">{principalName}</span>
        <span className="badge">{projectName}</span>
      </div>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: 'pointer' }}>Quick controls / Edit / Delete</summary>
        <form action={inlineAssignTask} className="form-row" style={{ marginTop: 8 }}>
          <input type="hidden" name="title" value={task.title} readOnly />
          <label htmlFor={`assignee-${task.id}`}>Assignee</label>
          <select id={`assignee-${task.id}`} name="assigneeId" defaultValue={task.assigneeId ? String(task.assigneeId) : ''} aria-label={`Set assignee for task ${task.id}`}>
            <option value="">Unassigned</option>
            {principals.map((principal) => (
              <option key={principal.id} value={principal.id}>
                {principal.displayName ?? `Principal ${principal.id}`}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary">Assign</button>
        </form>
        <form action={inlineUpdateTask} className="form-stack" style={{ marginTop: 8 }}>
          <input name="title" defaultValue={task.title} aria-label={`Edit title for task ${task.id}`} required />
          <input name="description" defaultValue={task.description ?? ''} aria-label={`Edit description for task ${task.id}`} />
          <div className="form-row">
            <label htmlFor={`project-${task.id}`}>Project</label>
            <select id={`project-${task.id}`} name="projectId" defaultValue={task.projectId ? String(task.projectId) : ''} aria-label={`Set project for task ${task.id}`}>
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name ?? `Project ${project.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor={`priority-${task.id}`}>Priority</label>
            <select id={`priority-${task.id}`} name="priority" defaultValue={String(task.priority ?? 3)} aria-label={`Set priority for task ${task.id}`}>
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>{`P${level}`}</option>
              ))}
            </select>
            <label htmlFor={`due-${task.id}`}>Due</label>
            <input id={`due-${task.id}`} name="dueAt" type="datetime-local" defaultValue={dueAtLocal} aria-label={`Set due date for task ${task.id}`} />
          </div>
          <div className="form-row">
            <button type="submit">Save</button>
            <button type="submit" formAction={inlineDeleteTask} className="btn btn-secondary" aria-label={`Delete task ${task.id}`}>
              Delete
            </button>
          </div>
        </form>
      </details>
    </article>
  );
}

function InlineCreateTaskForm({
  boardName,
  columnId,
  columnName,
  projectId,
  defaultState
}: {
  boardName: string;
  columnId: number;
  columnName: string;
  projectId?: number;
  defaultState: string;
}) {
  async function inlineCreate(formData: FormData) {
    'use server';
    if (!projectId) {
      return;
    }
    formData.set('state', defaultState);
    formData.set('boardColumnId', String(columnId));
    formData.set('projectId', String(projectId));
    formData.set('priority', '3');
    await createTaskAction(INITIAL_ACTION_STATE, formData);
  }

  return (
    <form action={inlineCreate} className="form-row" style={{ marginBlock: '0.6rem 0 0.8rem' }}>
      <input
        name="title"
        placeholder={`Add task in ${columnName}`}
        aria-label={`Task title for ${boardName} / ${columnName}`}
        required
      />
      <button type="submit">Add</button>
    </form>
  );
}

function InlineCreateColumnForm({ boardId, nextPosition }: { boardId: number; nextPosition: number }) {
  async function inlineCreateColumn(formData: FormData) {
    'use server';
    formData.set('boardId', String(boardId));
    formData.set('position', String(nextPosition));
    await createColumnAction(INITIAL_ACTION_STATE, formData);
  }

  return (
    <form action={inlineCreateColumn} className="form-row" style={{ marginTop: '0.5rem' }}>
      <input name="name" placeholder="Add column" aria-label="New column name" required />
      <button type="submit">Add column</button>
    </form>
  );
}

function InlineColumnControls({
  columnId,
  columnName,
  columnPosition,
  taskCount
}: {
  columnId: number;
  columnName: string;
  columnPosition: number;
  taskCount: number;
}) {
  async function inlineRenameColumn(formData: FormData) {
    'use server';
    formData.set('columnId', String(columnId));
    formData.set('position', String(columnPosition));
    await updateColumnAction(INITIAL_ACTION_STATE, formData);
  }

  async function inlineDeleteColumn(formData: FormData) {
    'use server';
    formData.set('columnId', String(columnId));
    await deleteColumnAction(INITIAL_ACTION_STATE, formData);
  }

  return (
    <details style={{ marginTop: 6 }}>
      <summary style={{ cursor: 'pointer' }}>Edit column</summary>
      <form action={inlineRenameColumn} className="form-row" style={{ marginTop: 8 }}>
        <input name="name" defaultValue={columnName} aria-label={`Rename column ${columnName}`} required />
        <button type="submit" className="btn btn-secondary">Rename</button>
      </form>
      <form action={inlineDeleteColumn} style={{ marginTop: 6 }}>
        <input type="hidden" name="name" value={columnName} readOnly />
        <input type="hidden" name="position" value={String(columnPosition)} readOnly />
        <button type="submit" className="btn btn-secondary" aria-label={`Delete column ${columnName}`} disabled={taskCount > 0}>
          Delete column
        </button>
      </form>
      {taskCount > 0 && <p className="muted">Move or complete tasks before deleting this column.</p>}
    </details>
  );
}

function MoveColumnForm({
  columnId,
  columnName,
  boardId,
  boardHref,
  toPosition,
  disabled,
  direction,
  instructionId
}: {
  columnId: number;
  columnName: string;
  boardId: number;
  boardHref: string;
  toPosition: number;
  disabled: boolean;
  direction: 'left' | 'right';
  instructionId: string;
}) {
  async function moveColumn(formData: FormData) {
    'use server';
    formData.set('columnId', String(columnId));
    formData.set('name', columnName);
    formData.set('position', String(toPosition));
    await updateColumnAction(INITIAL_ACTION_STATE, formData);
  }

  return (
    <form action={moveColumn}>
      <input type="hidden" name="boardId" value={boardId} />
      <button
        type="submit"
        className="btn btn-secondary lane-move-btn"
        disabled={disabled}
        aria-label={direction === 'left' ? `Move ${columnName} left` : `Move ${columnName} right`}
        aria-describedby={instructionId}
        title={direction === 'left' ? 'Move column left' : 'Move column right'}
      >
        {direction === 'left' ? 'Move left' : 'Move right'}
      </button>
    </form>
  );
}

export function BoardLanesSection({
  laneView,
  boards,
  columns,
  principals,
  projects,
  activeFilterBadges = [],
  presetLinks = [],
  boardFilter = null,
  boardHref = '/board',
  columnMoveNotice = '',
  columnMoveStatus = ''
}: {
  laneView: BoardLaneView;
  boards: Entity[];
  columns: Entity[];
  principals: Entity[];
  projects: Entity[];
  activeFilterBadges?: { label: string; clearHref: string }[];
  presetLinks?: { key: string; label: string; href: string }[];
  boardFilter?: {
    assigneeId: string;
    projectId: string;
    state: string;
    priority: string;
    dueWindow: string;
    search: string;
    assigneeOptions: { id: number; label: string }[];
    projectOptions: { id: number; label: string }[];
    resetHref: string;
    hiddenParams: [string, string][];
    assigneeLabel: string;
    assigneeClearHref: string;
    projectLabel: string;
    projectClearHref: string;
  } | null;
  boardHref?: string;
  columnMoveNotice?: string;
  columnMoveStatus?: string;
}) {
  const activeFilterCount = activeFilterBadges.length;
  const boardSavedViewLinks = boardFilter
    ? (() => {
        const currentFilter: BoardFilterComparable = {
          assigneeId: normalizeBoardFilterValue(boardFilter.assigneeId),
          projectId: normalizeBoardFilterValue(boardFilter.projectId),
          state: normalizeBoardFilterValue(boardFilter.state),
          priority: normalizeBoardFilterValue(boardFilter.priority),
          dueWindow: normalizeBoardFilterValue(boardFilter.dueWindow),
          search: normalizeBoardFilterValue(boardFilter.search)
        };

        const views: Array<{ key: string; label: string; overrides: BoardFilterOverrides }> = [
          {
            key: 'assigned',
            label: 'Assigned to me',
            overrides: {
              assigneeId: boardFilter.assigneeId || '2',
              projectId: boardFilter.projectId,
              state: 'next,scheduled',
              priority: '',
              dueWindow: '',
              search: ''
            }
          },
          {
            key: 'priority',
            label: 'Priority P1',
            overrides: {
              assigneeId: boardFilter.assigneeId,
              projectId: boardFilter.projectId,
              state: 'next,scheduled',
              priority: '1',
              dueWindow: '',
              search: ''
            }
          },
          {
            key: 'mobile',
            label: 'Mobile sweep (3d)',
            overrides: {
              assigneeId: boardFilter.assigneeId,
              projectId: boardFilter.projectId,
              state: 'next,scheduled',
              priority: '',
              dueWindow: '72',
              search: ''
            }
          }
        ];

        return views.map((view) => {
          const target = resolveBoardFilterTarget(currentFilter, view.overrides);
          return {
            key: view.key,
            label: view.label,
            href: buildBoardFilterHref(boardHref, boardFilter.hiddenParams, view.overrides),
            active: isSavedViewActive(currentFilter, target)
          };
        });
      })()
    : [];
  const activeSavedView = boardSavedViewLinks.find((view) => view.active);

  const principalNames = new Map<number, string>();
  for (const principal of principals) {
    principalNames.set(principal.id, principal.displayName ?? `Principal ${principal.id}`);
  }

  const projectNames = new Map<number, string>();
  for (const project of projects) {
    projectNames.set(project.id, project.name ?? `Project ${project.id}`);
  }

  const boardProjectIDs = new Map<number, number>();
  for (const board of boards) {
    const maybeProjectID = Number(board.projectId);
    if (Number.isInteger(maybeProjectID) && maybeProjectID > 0) {
      boardProjectIDs.set(board.id, maybeProjectID);
    }
  }

  const hasVisibleBoardTasks =
    laneView.tasksWithoutColumn.length > 0 ||
    laneView.boards.some((board) => board.columns.some((column) => column.tasks.length > 0));
  const showFilteredEmptyState = activeFilterCount > 0 && !hasVisibleBoardTasks;

  return (
    <section className="panel board-panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Kanban</p>
          <h2>Board workflow</h2>
        </div>
      </div>


      <section className="board-filter-toolbar board-filter-toolbar-shadow-cue" aria-label="Board filter toolbar">
        {presetLinks.length > 0 && (
          <div className="badge-row board-preset-row" aria-label="Shareable board filter presets">
            <span className="muted">Shareable presets:</span>
            {presetLinks.map((preset) => (
              <a key={preset.key} className="btn btn-secondary" href={preset.href} title={`Open ${preset.label} preset`}>
                {preset.label}
              </a>
            ))}
          </div>
        )}

        {boardSavedViewLinks.length > 0 && (
          <div className="badge-row board-saved-view-row" aria-label="Saved board views">
            <span className="muted">Saved views:</span>
            {boardSavedViewLinks.map((view) => (
              <a
                key={view.key}
                className={`badge badge-saved-view${view.active ? ' badge-saved-view-active' : ''}`}
                href={view.href}
                title={`Open ${view.label} board view`}
                aria-current={view.active ? 'page' : undefined}
              >
                {view.label}
              </a>
            ))}
            {activeSavedView && (
              <span className="muted board-saved-view-helper" aria-label={`Active saved view ${activeSavedView.label}. One-click reset available`}>
                Active: <strong>{activeSavedView.label}</strong> · One-click reset to all cards:
                <a className="badge badge-reset-all" href={boardFilter?.resetHref ?? '/board'}>
                  Reset view ×
                </a>
              </span>
            )}
          </div>
        )}

        {boardFilter && (
          <>
            <form method="GET" className="board-filter-grid" aria-label="Board filters">
              {boardFilter.hiddenParams.map(([key, value]) => (
                <input key={`${key}-${value}`} type="hidden" name={key} value={value} />
              ))}
              <input type="hidden" name="taskPage" value="1" />
              <select name="taskAssigneeId" defaultValue={boardFilter.assigneeId} aria-label="Filter board by assignee">
                <option value="">All assignees</option>
                {boardFilter.assigneeOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>{option.label}</option>
                ))}
              </select>
              <select name="taskProjectId" defaultValue={boardFilter.projectId} aria-label="Filter board by project">
                <option value="">All projects</option>
                {boardFilter.projectOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>{option.label}</option>
                ))}
              </select>
              <select name="taskState" defaultValue={boardFilter.state} aria-label="Filter board by state">
                <option value="">All states</option>
                <option value="inbox">inbox</option>
                <option value="next">next</option>
                <option value="scheduled">scheduled</option>
                <option value="waiting">waiting</option>
                <option value="done">done</option>
                <option value="cancelled">cancelled</option>
                <option value="next,scheduled">next + scheduled</option>
              </select>
              <select name="taskPriority" defaultValue={boardFilter.priority} aria-label="Filter board by priority">
                <option value="">Any priority</option>
                <option value="1">P1</option>
                <option value="2">P2</option>
                <option value="3">P3</option>
                <option value="4">P4</option>
                <option value="5">P5</option>
              </select>
              <div className="board-due-window-group" aria-label="Due window quick legend">
                <select name="taskDueWindow" defaultValue={boardFilter.dueWindow} aria-label="Filter board by due window">
                  <option value="">Any due window</option>
                  <option value="24">Due in 24h</option>
                  <option value="72">Due in 3d</option>
                  <option value="168">Due in 7d</option>
                </select>
                <div className="badge-row board-due-window-legend" aria-hidden="true">
                  <span className="badge board-due-window-chip">24h</span>
                  <span className="badge board-due-window-chip">3d</span>
                  <span className="badge board-due-window-chip">7d</span>
                </div>
              </div>
              <input name="taskQ" defaultValue={boardFilter.search} placeholder="Search cards" aria-label="Search board cards" />
              <div className="board-filter-controls" aria-label="Board filter actions">
                <button type="submit">Apply filters</button>
                <a className="btn btn-secondary" href={boardFilter.resetHref}>Clear all</a>
                <span className="count-pill" aria-label={`${activeFilterCount} active filters in board toolbar`}>
                  {activeFilterCount} active
                </span>
              </div>
            </form>

            {activeFilterCount > 0 && (
              <div className="badge-row board-filter-reset-cluster" aria-label="One-tap filter reset chips">
                <span className="count-pill" aria-label={`${activeFilterCount} active filters`}>
                  {activeFilterCount} active
                </span>
                <a className="badge badge-reset-all" href={boardFilter.resetHref} aria-label="Clear all active board filters">
                  Reset all ×
                </a>
                {activeFilterBadges.map((badge) => (
                  <a
                    key={`cluster-${badge.label}`}
                    className="badge"
                    href={badge.clearHref}
                    aria-label={`Clear ${badge.label}`}
                    title={`Clear ${badge.label}`}
                  >
                    {badge.label} ×
                  </a>
                ))}
              </div>
            )}

            {(boardFilter.assigneeId || boardFilter.projectId) && (
              <div className="badge-row board-filter-quick-clear" aria-label="Quick clear board filters">
                <span className="muted">Quick clear:</span>
                {boardFilter.assigneeId && (
                  <a className="badge" href={boardFilter.assigneeClearHref} aria-label="Clear assignee filter">
                    Assignee: {boardFilter.assigneeLabel} ×
                  </a>
                )}
                {boardFilter.projectId && (
                  <a className="badge" href={boardFilter.projectClearHref} aria-label="Clear project filter">
                    Project: {boardFilter.projectLabel} ×
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <div className="board-toolbar-lanes-divider" aria-hidden="true" />

      <section className="board-shortcut-card" aria-label="Board advanced controls shortcut">
        <p className="eyebrow">Advanced controls</p>
        <h3>Need deeper board configuration?</h3>
        <p className="muted">
          Keep /board focused on execution. Open Settings for cache/runtime controls and roadmap-scope toggles.
        </p>
        <a className="btn btn-secondary" href="/settings#advanced-controls">
          Open advanced controls in Settings
        </a>
      </section>

      {showFilteredEmptyState && (
        <section className="board-empty-cta" aria-label="Board filtered empty state">
          <p className="eyebrow">No cards match current filters</p>
          <h3>Reset filters or adjust advanced controls</h3>
          <p className="muted">
            {activeFilterCount === 1
              ? '1 active filter is hiding every card. Clear filters to resume execution, or tune advanced controls in Settings.'
              : `${activeFilterCount} active filters are hiding every card. Clear filters to resume execution, or tune advanced controls in Settings.`}
          </p>
          <div className="badge-row board-empty-diagnostics" aria-label="Filtered empty-state diagnostics">
            <span className="muted">Active diagnostics:</span>
            {activeFilterBadges.slice(0, 4).map((badge) => (
              <a
                key={`empty-${badge.label}`}
                className="badge"
                href={badge.clearHref}
                aria-label={`Clear ${badge.label} from empty-state diagnostics`}
                title={`Clear ${badge.label}`}
              >
                {badge.label} ×
              </a>
            ))}
            {activeFilterBadges.length > 4 && (
              <span className="badge" aria-label={`${activeFilterBadges.length - 4} more active filters`}>
                +{activeFilterBadges.length - 4} more
              </span>
            )}
          </div>
          <div className="form-row" style={{ gap: 8 }}>
            <a className="btn" href={boardFilter?.resetHref ?? '/board'}>
              Clear filters
            </a>
            <a className="btn btn-secondary" href="/settings#advanced-controls">
              Open advanced controls
            </a>
          </div>
        </section>
      )}

      {activeFilterBadges.length > 0 && (
        <div className="badge-row" style={{ marginBottom: 10, gap: 8 }} aria-label="Active board filters">
          <span className="muted">Active filters:</span>
          {activeFilterBadges.map((badge) => (
            <a key={badge.label} className="badge" href={badge.clearHref} aria-label={`Clear ${badge.label}`} title={`Clear ${badge.label}`}>
              {badge.label} ×
            </a>
          ))}
        </div>
      )}

      {columnMoveNotice && (
        <div className="inline-alert" role="alert">
          <strong>{columnMoveNotice}</strong>
        </div>
      )}

      {columnMoveStatus && (
        <div className="inline-alert" role="status" aria-live="polite" aria-atomic="true">
          <strong>{columnMoveStatus}</strong>
        </div>
      )}

      {laneView.fetchErrors.length > 0 && (
        <div className="inline-alert" role="alert">
          <strong>Board lanes are incomplete due to data loading issues.</strong>
          <ul>
            {laneView.fetchErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <article className="board-shell no-column-lane">
        <div className="column-header-row">
          <h3>Inbox without column</h3>
          <span className="count-pill">{laneView.tasksWithoutColumn.length}</span>
        </div>
        {laneView.tasksWithoutColumn.length === 0 ? (
          <p className="muted">Every task is currently assigned to a board column.</p>
        ) : (
          <div className="task-stack">
            {laneView.tasksWithoutColumn.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                principalName={task.assigneeId ? principalNames.get(task.assigneeId) ?? `Principal ${task.assigneeId}` : 'Unassigned'}
                projectName={task.projectId ? projectNames.get(task.projectId) ?? `Project ${task.projectId}` : 'No project'}
                principals={principals}
                projects={projects}
              />
            ))}
          </div>
        )}
      </article>

      {laneView.boards.map((board) => (
        <article key={board.id} className="board-shell">
          <div className="board-title-row">
            <h3>{board.name}</h3>
            <span className="count-pill">{board.columns.length} columns</span>
          </div>
          <InlineCreateColumnForm
            boardId={board.id}
            nextPosition={
              board.columns.length === 0
                ? 10
                : Math.max(...board.columns.map((column) => Number(column.position) || 0)) + 10
            }
          />

          {board.columns.length === 0 ? (
            <div className="empty-state">No columns defined for this board yet.</div>
          ) : (
            <div className="kanban-scroll-wrap" aria-hidden="true">
              <span className="kanban-scroll-fade kanban-scroll-fade-left" />
              <span className="kanban-scroll-fade kanban-scroll-fade-right" />
              <span className="kanban-scroll-edge-label kanban-scroll-edge-label-left">Scroll ↔</span>
              <span className="kanban-scroll-edge-label kanban-scroll-edge-label-right">Swipe lanes</span>
            </div>
          )}

          {board.columns.length > 0 && (
            <div className="kanban-scroll" role="region" aria-label={`${board.name} columns`}>
              {board.columns.map((column, index) => {
                const normalizedColumn = column.name.trim().toLowerCase();
                const leftNeighbor = index > 0 ? board.columns[index - 1] : null;
                const rightNeighbor = index < board.columns.length - 1 ? board.columns[index + 1] : null;
                const defaultState =
                  normalizedColumn === 'inbox'
                    ? 'inbox'
                    : normalizedColumn === 'next'
                      ? 'next'
                      : normalizedColumn === 'in progress'
                        ? 'scheduled'
                        : normalizedColumn === 'blocked'
                          ? 'waiting'
                          : normalizedColumn === 'done'
                            ? 'done'
                            : 'next';

                const moveInstructionId = `column-reorder-hint-${column.id}`;

                return (
                  <section key={column.id} className="kanban-column">
                    <p id={moveInstructionId} className="sr-only">
                      Keyboard tip: use Tab to focus move buttons, then press Enter or Space to reorder column {column.name}.
                    </p>
                    <div className="kanban-column-header">
                      <div className="column-header-row">
                        <h4>{column.name}</h4>
                        <div className="form-row lane-header-actions">
                          <div className="lane-move-controls" aria-label={`Reorder controls for ${column.name}`}>
                            <MoveColumnForm
                              columnId={column.id}
                              columnName={column.name}
                              boardId={board.id}
                              boardHref={boardHref}
                              toPosition={leftNeighbor ? leftNeighbor.position - 1 : column.position}
                              disabled={!leftNeighbor}
                              direction="left"
                              instructionId={moveInstructionId}
                            />
                            <MoveColumnForm
                              columnId={column.id}
                              columnName={column.name}
                              boardId={board.id}
                              boardHref={boardHref}
                              toPosition={rightNeighbor ? rightNeighbor.position + 1 : column.position}
                              disabled={!rightNeighbor}
                              direction="right"
                              instructionId={moveInstructionId}
                            />
                          </div>
                          <span className="count-pill lane-count-pill" aria-label={`${column.tasks.length} tasks in ${column.name}`}>
                            {column.tasks.length}
                          </span>
                        </div>
                      </div>
                      <InlineColumnControls
                        columnId={column.id}
                        columnName={column.name}
                        columnPosition={column.position}
                        taskCount={column.tasks.length}
                      />
                      <InlineCreateTaskForm
                        boardName={board.name}
                        columnId={column.id}
                        columnName={column.name}
                        projectId={boardProjectIDs.get(board.id)}
                        defaultState={defaultState}
                      />
                    </div>
                    {column.tasks.length === 0 ? (
                      <p className="muted">No tasks in this column.</p>
                    ) : (
                      <div className="task-stack">
                        {column.tasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            principalName={task.assigneeId ? principalNames.get(task.assigneeId) ?? `Principal ${task.assigneeId}` : 'Unassigned'}
                            projectName={task.projectId ? projectNames.get(task.projectId) ?? `Project ${task.projectId}` : 'No project'}
                            principals={principals}
                            projects={projects}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </article>
      ))}

      {boards.length === 0 && <div className="empty-state">No boards yet. Create your first board to start planning.</div>}
      {boards.length > 0 && columns.length === 0 && (
        <div className="empty-state">Boards exist but no columns are defined yet.</div>
      )}
    </section>
  );
}
