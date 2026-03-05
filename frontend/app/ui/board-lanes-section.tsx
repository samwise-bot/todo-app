import React from 'react';
import type { BoardLaneView } from '../../lib/board-lanes';
import { assignTaskAction, createColumnAction, createTaskAction, deleteTaskAction, updateColumnAction, updateTaskAction } from '../actions';
import { INITIAL_ACTION_STATE } from '../../lib/action-state';

type Entity = { id: number; name?: string; displayName?: string; [key: string]: unknown };

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

function MoveColumnForm({
  columnId,
  columnName,
  boardId,
  toPosition,
  disabled,
  direction
}: {
  columnId: number;
  columnName: string;
  boardId: number;
  toPosition: number;
  disabled: boolean;
  direction: 'left' | 'right';
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
        className="btn btn-secondary"
        disabled={disabled}
        aria-label={direction === 'left' ? `Move ${columnName} left` : `Move ${columnName} right`}
        title={direction === 'left' ? 'Move column left' : 'Move column right'}
      >
        {direction === 'left' ? '←' : '→'}
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
  presetLinks = []
}: {
  laneView: BoardLaneView;
  boards: Entity[];
  columns: Entity[];
  principals: Entity[];
  projects: Entity[];
  activeFilterBadges?: { label: string; clearHref: string }[];
  presetLinks?: { key: string; label: string; href: string }[];
}) {
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

  return (
    <section className="panel board-panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Kanban</p>
          <h2>Board workflow</h2>
        </div>
      </div>

      {presetLinks.length > 0 && (
        <div className="badge-row" style={{ marginBottom: 10, gap: 8 }} aria-label="Shareable board filter presets">
          <span className="muted">Shareable presets:</span>
          {presetLinks.map((preset) => (
            <a key={preset.key} className="btn btn-secondary" href={preset.href} title={`Open ${preset.label} preset`}>
              {preset.label}
            </a>
          ))}
        </div>
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

                return (
                  <section key={column.id} className="kanban-column">
                    <div className="column-header-row">
                      <h4>{column.name}</h4>
                      <div className="form-row" style={{ gap: 6 }}>
                        <MoveColumnForm
                          columnId={column.id}
                          columnName={column.name}
                          boardId={board.id}
                          toPosition={leftNeighbor ? leftNeighbor.position - 1 : column.position}
                          disabled={!leftNeighbor}
                          direction="left"
                        />
                        <MoveColumnForm
                          columnId={column.id}
                          columnName={column.name}
                          boardId={board.id}
                          toPosition={rightNeighbor ? rightNeighbor.position + 1 : column.position}
                          disabled={!rightNeighbor}
                          direction="right"
                        />
                        <span className="count-pill">{column.tasks.length}</span>
                      </div>
                    </div>
                    <InlineCreateTaskForm
                      boardName={board.name}
                      columnId={column.id}
                      columnName={column.name}
                      projectId={boardProjectIDs.get(board.id)}
                      defaultState={defaultState}
                    />
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
