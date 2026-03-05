import React from 'react';
import type { BoardLaneView } from '../../lib/board-lanes';
import { createColumnAction, createTaskAction, deleteTaskAction, updateTaskAction } from '../actions';
import { INITIAL_ACTION_STATE } from '../../lib/action-state';

type Entity = { id: number; name?: string; displayName?: string; [key: string]: unknown };

function TaskCard({
  task,
  principalName,
  projectName
}: {
  task: { id: number; title: string; description?: string; state: string; assigneeId?: number | null; projectId?: number | null };
  principalName: string;
  projectName: string;
}) {
  async function inlineUpdateTask(formData: FormData) {
    'use server';
    formData.set('taskId', String(task.id));
    await updateTaskAction(INITIAL_ACTION_STATE, formData);
  }

  async function inlineDeleteTask(formData: FormData) {
    'use server';
    formData.set('taskId', String(task.id));
    await deleteTaskAction(INITIAL_ACTION_STATE, formData);
  }

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
        <summary style={{ cursor: 'pointer' }}>Edit / Delete</summary>
        <form action={inlineUpdateTask} className="form-stack" style={{ marginTop: 8 }}>
          <input name="title" defaultValue={task.title} aria-label={`Edit title for task ${task.id}`} required />
          <input name="description" defaultValue={task.description ?? ''} aria-label={`Edit description for task ${task.id}`} />
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
              {board.columns.map((column) => {
                const normalizedColumn = column.name.trim().toLowerCase();
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
                      <span className="count-pill">{column.tasks.length}</span>
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
