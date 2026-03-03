import React from 'react';
import type { BoardLaneView } from '../../lib/board-lanes';

type Entity = { id: number; name?: string; displayName?: string; [key: string]: unknown };

function TaskCard({
  task,
  principalName,
  projectName
}: {
  task: { id: number; title: string; state: string; assigneeId?: number | null; projectId?: number | null };
  principalName: string;
  projectName: string;
}) {
  return (
    <article className="task-card">
      <h5>{task.title}</h5>
      <div className="badge-row">
        <span className="badge badge-state">{task.state}</span>
        <span className="badge">{principalName}</span>
        <span className="badge">{projectName}</span>
      </div>
    </article>
  );
}

export function BoardLanesSection({
  laneView,
  boards,
  columns,
  principals,
  projects
}: {
  laneView: BoardLaneView;
  boards: Entity[];
  columns: Entity[];
  principals: Entity[];
  projects: Entity[];
}) {
  const principalNames = new Map<number, string>();
  for (const principal of principals) {
    principalNames.set(principal.id, principal.displayName ?? `Principal ${principal.id}`);
  }

  const projectNames = new Map<number, string>();
  for (const project of projects) {
    projectNames.set(project.id, project.name ?? `Project ${project.id}`);
  }

  return (
    <section className="panel board-panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Kanban</p>
          <h2>Board workflow</h2>
        </div>
      </div>

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

          {board.columns.length === 0 ? (
            <div className="empty-state">No columns defined for this board yet.</div>
          ) : (
            <div className="kanban-scroll" role="region" aria-label={`${board.name} columns`}>
              {board.columns.map((column) => (
                <section key={column.id} className="kanban-column">
                  <div className="column-header-row">
                    <h4>{column.name}</h4>
                    <span className="count-pill">{column.tasks.length}</span>
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
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
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
