import Link from 'next/link';
import React from 'react';

import { createProjectAction } from './actions';
import { TASK_STATES } from '../lib/task-states';
import { buildBoardLaneView } from '../lib/board-lanes';
import { buildBoardInspectorMetrics } from '../lib/board-inspector';
import { fetchCollection, fetchPagedCollection } from '../lib/api-client';
import {
  hiddenParamEntries,
  readPositiveIntParam,
  readStringParam,
  toURLSearchParams,
  updateSearchParams,
  type SearchParamsInput
} from '../lib/list-query';
import {
  AssignTaskForm,
  CreateBoardForm,
  CreateColumnForm,
  CreatePrincipalForm,
  CreateTaskForm,
  DeleteBoardForm,
  DeleteColumnForm,
  SetTaskBoardColumnForm,
  TransitionTaskStateForm,
  UpdateBoardForm,
  UpdateColumnForm
} from './action-forms';
import { BoardLanesSection } from './ui/board-lanes-section';
import { GTDStateSection } from './ui/gtd-state-section';

type Project = { id: number; name: string; description?: string };
type Principal = { id: number; displayName: string; kind: string; handle: string };
type Board = { id: number; projectId: number; name: string };
type Column = { id: number; boardId: number; name: string; position: number };
type Task = {
  id: number;
  title: string;
  description?: string;
  state: string;
  assigneeId?: number | null;
  projectId?: number | null;
  boardColumnId?: number | null;
  dueAt?: string | null;
};

function withQueryString(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

function SectionError({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="inline-alert" role="alert">{error}</div>;
}

export default async function HomePage({ searchParams }: { searchParams?: SearchParamsInput }) {
  const currentParams = toURLSearchParams(searchParams);

  const principalKind = readStringParam(currentParams, 'principalKind', '');
  const principalQ = readStringParam(currentParams, 'principalQ', '');
  const principalPage = readPositiveIntParam(currentParams, 'principalPage', 1);
  const principalPageSize = readPositiveIntParam(currentParams, 'principalPageSize', 10);

  const taskState = readStringParam(currentParams, 'taskState', '');
  const taskStates = taskState
    .split(',')
    .map((state) => state.trim())
    .filter((state): state is (typeof TASK_STATES)[number] => TASK_STATES.includes(state as (typeof TASK_STATES)[number]));
  const taskQ = readStringParam(currentParams, 'taskQ', '');
  const taskProjectId = readStringParam(currentParams, 'taskProjectId', '');
  const taskAssigneeId = readStringParam(currentParams, 'taskAssigneeId', '');
  const taskBoardColumnId = readStringParam(currentParams, 'taskBoardColumnId', '');
  const taskPage = readPositiveIntParam(currentParams, 'taskPage', 1);
  const taskPageSize = readPositiveIntParam(currentParams, 'taskPageSize', 10);

  const principalAPIQuery = new URLSearchParams({
    page: String(principalPage),
    pageSize: String(principalPageSize)
  });
  if (principalKind) {
    principalAPIQuery.set('kind', principalKind);
  }
  if (principalQ) {
    principalAPIQuery.set('q', principalQ);
  }

  const taskAPIQuery = new URLSearchParams({
    page: String(taskPage),
    pageSize: String(taskPageSize)
  });
  if (taskStates.length === 1) {
    taskAPIQuery.set('state', taskStates[0]);
  }
  if (taskQ) {
    taskAPIQuery.set('q', taskQ);
  }
  if (taskProjectId) {
    taskAPIQuery.set('projectId', taskProjectId);
  }
  if (taskAssigneeId) {
    taskAPIQuery.set('assigneeId', taskAssigneeId);
  }
  if (taskBoardColumnId) {
    taskAPIQuery.set('boardColumnId', taskBoardColumnId);
  }

  const [projectsResult, principalsAllResult, principalsListResult, boardsResult, columnsResult, tasksAllResult, tasksListResult] = await Promise.all([
    fetchCollection<Project>('/api/projects', 'Projects'),
    fetchPagedCollection<Principal>('/api/principals?page=1&pageSize=1000', 'Principals'),
    fetchPagedCollection<Principal>(`/api/principals?${principalAPIQuery.toString()}`, 'Principals'),
    fetchCollection<Board>('/api/boards', 'Boards'),
    fetchCollection<Column>('/api/columns', 'Columns'),
    fetchPagedCollection<Task>('/api/tasks?page=1&pageSize=1000', 'Tasks'),
    fetchPagedCollection<Task>(`/api/tasks?${taskAPIQuery.toString()}`, 'Tasks')
  ]);

  const projects = projectsResult.items;
  const principals = principalsAllResult.items;
  const principalList = principalsListResult.items;
  const boards = boardsResult.items;
  const columns = columnsResult.items;
  const tasks = tasksAllResult.items;
  const taskList = taskStates.length > 1
    ? tasksListResult.items.filter((task) => taskStates.includes(task.state as (typeof TASK_STATES)[number]))
    : tasksListResult.items;
  const boardInspector = buildBoardInspectorMetrics(tasks);

  const laneView = buildBoardLaneView({
    boards,
    columns,
    tasks,
    fetchErrors: [boardsResult.error, columnsResult.error, tasksAllResult.error].filter((error): error is string => Boolean(error))
  });

  const columnsByBoard = new Map<number, Column[]>();
  for (const column of columns) {
    const bucket = columnsByBoard.get(column.boardId) ?? [];
    bucket.push(column);
    columnsByBoard.set(column.boardId, bucket);
  }

  const boardsByID = new Map<number, Board>();
  for (const board of boards) {
    boardsByID.set(board.id, board);
  }

  const taskColumns = columns.map((column) => {
    const boardName = boardsByID.get(column.boardId)?.name ?? `Board ${column.boardId}`;
    return { id: column.id, label: `${boardName} / ${column.name}` };
  });

  const projectByID = new Map<number, Project>();
  for (const project of projects) {
    projectByID.set(project.id, project);
  }

  const principalByID = new Map<number, Principal>();
  for (const principal of principals) {
    principalByID.set(principal.id, principal);
  }

  const principalHidden = hiddenParamEntries(currentParams, ['principalKind', 'principalQ', 'principalPage', 'principalPageSize']);
  const taskHidden = hiddenParamEntries(currentParams, ['taskState', 'taskQ', 'taskProjectId', 'taskAssigneeId', 'taskBoardColumnId', 'taskPage', 'taskPageSize']);

  const principalPrevLink = withQueryString(updateSearchParams(currentParams, { principalPage: principalPage - 1 }));
  const principalNextLink = withQueryString(updateSearchParams(currentParams, { principalPage: principalPage + 1 }));
  const principalResetLink = withQueryString(updateSearchParams(currentParams, {
    principalKind: null,
    principalQ: null,
    principalPage: null,
    principalPageSize: null
  }));

  const taskPrevLink = withQueryString(updateSearchParams(currentParams, { taskPage: taskPage - 1 }));
  const taskNextLink = withQueryString(updateSearchParams(currentParams, { taskPage: taskPage + 1 }));
  const taskResetLink = withQueryString(updateSearchParams(currentParams, {
    taskState: null,
    taskQ: null,
    taskProjectId: null,
    taskAssigneeId: null,
    taskBoardColumnId: null,
    taskPage: null,
    taskPageSize: null
  }));

  return (
    <main className="app-shell">
      <header className="page-header">
        <h1>GTD + Kanban TODO</h1>
        <p>Plan by project, operate in board columns, and keep GTD states visible in the same workflow.</p>
      </header>

      <section className="dashboard-grid">
        <form action={createProjectAction} className="form-card">
          <h2>Create project</h2>
          <div className="form-stack">
            <input name="name" placeholder="Project name" required />
            <input name="description" placeholder="Description" />
            <button type="submit">Create project</button>
          </div>
        </form>

        <CreateTaskForm projects={projects} taskColumns={taskColumns} />
        <CreatePrincipalForm />
      </section>

      <BoardLanesSection laneView={laneView} boards={boards} columns={columns} principals={principals} projects={projects} />

      <section className="panel" aria-label="Board inspector">
        <div className="panel-header-row">
          <div>
            <p className="eyebrow">Inspector</p>
            <h2>Board health</h2>
          </div>
        </div>
        <div className="badge-row" style={{ gap: 10 }}>
          <span className="badge">Next: {boardInspector.nextCount}</span>
          <span className="badge">In Progress: {boardInspector.inProgressCount}</span>
          <span className="badge">Blocked: {boardInspector.blockedCount}</span>
          <span className="badge">Unassigned: {boardInspector.unassignedCount}</span>
          <span className="badge">Overdue: {boardInspector.overdueCount}</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <div>
            <p className="eyebrow">Tasks</p>
            <h2>Task explorer</h2>
          </div>
        </div>
        <SectionError error={tasksListResult.error} />

        <form method="GET" className="filters-grid">
          {taskHidden.map(([key, value]) => <input key={`${key}-${value}`} type="hidden" name={key} value={value} />)}
          <input type="hidden" name="taskPage" value="1" />
          <input name="taskQ" defaultValue={taskQ} placeholder="Search title/description" />
          <select name="taskState" defaultValue={taskState}>
            <option value="">All states</option>
            {TASK_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <input name="taskProjectId" defaultValue={taskProjectId} placeholder="Project ID" inputMode="numeric" />
          <input name="taskAssigneeId" defaultValue={taskAssigneeId} placeholder="Assignee ID" inputMode="numeric" />
          <input name="taskBoardColumnId" defaultValue={taskBoardColumnId} placeholder="Board column ID" inputMode="numeric" />
          <select name="taskPageSize" defaultValue={String(taskPageSize)}>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
          <button type="submit">Apply</button>
          <Link className="btn btn-secondary" href={taskResetLink}>Reset</Link>
        </form>

        <p className="muted" style={{ marginTop: 10 }}>
          Showing {taskList.length} of {taskStates.length > 1 ? taskList.length : tasksListResult.totalItems} tasks.
        </p>

        {taskList.length === 0 ? (
          <div className="empty-state">No tasks matched the current filter.</div>
        ) : (
          <ul className="task-list">
            {taskList.map((task) => (
              <li key={task.id} className="task-item">
                <strong>{task.title}</strong>
                <div className="badge-row" style={{ marginTop: 6, marginBottom: 10 }}>
                  <span className="badge badge-state">{task.state}</span>
                  <span className="badge">{task.assigneeId ? principalByID.get(task.assigneeId)?.displayName ?? `Principal ${task.assigneeId}` : 'Unassigned'}</span>
                  <span className="badge">{task.projectId ? projectByID.get(task.projectId)?.name ?? `Project ${task.projectId}` : 'No project'}</span>
                </div>
                <div className="form-row">
                  <TransitionTaskStateForm task={task} />
                  <AssignTaskForm task={task} principals={principals} />
                  <SetTaskBoardColumnForm task={task} taskColumns={taskColumns} />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="pagination-row">
          {taskStates.length > 1 ? (
            <span className="muted">Multi-state focus mode is showing in-memory filtered results.</span>
          ) : (
            <>
              {taskPage > 1 ? <Link className="btn btn-secondary" href={taskPrevLink}>Previous</Link> : <span className="muted">Previous</span>}
              <span>Page {tasksListResult.page} / {Math.max(tasksListResult.totalPages, 1)}</span>
              {tasksListResult.page < tasksListResult.totalPages ? <Link className="btn btn-secondary" href={taskNextLink}>Next</Link> : <span className="muted">Next</span>}
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <div>
            <p className="eyebrow">Boards</p>
            <h2>Board management</h2>
          </div>
        </div>
        <SectionError error={boardsResult.error || columnsResult.error} />
        <CreateBoardForm projects={projects} />

        {boards.length === 0 ? (
          <div className="empty-state">No boards yet. Create one to start your Kanban workflow.</div>
        ) : (
          <div className="board-admin-grid">
            {boards.map((board) => (
              <article key={board.id} className="board-admin-card">
                <div className="board-title-row">
                  <h3>{board.name}</h3>
                  <span className="count-pill">{(columnsByBoard.get(board.id) ?? []).length} columns</span>
                </div>
                <div className="form-row">
                  <UpdateBoardForm board={board} />
                  <DeleteBoardForm boardId={board.id} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <CreateColumnForm boardId={board.id} />
                </div>
                <div style={{ marginTop: 10 }}>
                  {(columnsByBoard.get(board.id) ?? []).length === 0 ? (
                    <p className="muted">No columns for this board.</p>
                  ) : (
                    (columnsByBoard.get(board.id) ?? []).map((column) => (
                      <div key={column.id} className="form-row" style={{ marginBottom: 8 }}>
                        <UpdateColumnForm column={column} />
                        <DeleteColumnForm columnId={column.id} />
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <div>
            <p className="eyebrow">People</p>
            <h2>Principals</h2>
          </div>
        </div>
        <SectionError error={principalsListResult.error} />

        <form method="GET" className="filters-grid">
          {principalHidden.map(([key, value]) => <input key={`${key}-${value}`} type="hidden" name={key} value={value} />)}
          <input type="hidden" name="principalPage" value="1" />
          <input name="principalQ" defaultValue={principalQ} placeholder="Search handle/display name" />
          <select name="principalKind" defaultValue={principalKind}>
            <option value="">All kinds</option>
            <option value="human">human</option>
            <option value="agent">agent</option>
          </select>
          <select name="principalPageSize" defaultValue={String(principalPageSize)}>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
          <button type="submit">Apply</button>
          <Link className="btn btn-secondary" href={principalResetLink}>Reset</Link>
        </form>

        <p className="muted" style={{ marginTop: 10 }}>Showing {principalList.length} of {principalsListResult.totalItems} principals.</p>
        {principalList.length === 0 ? (
          <div className="empty-state">No principals matched the current filter.</div>
        ) : (
          <ul className="compact-list">
            {principalList.map((principal) => (
              <li key={principal.id}>{principal.displayName} ({principal.kind}) - @{principal.handle}</li>
            ))}
          </ul>
        )}

        <div className="pagination-row">
          {principalPage > 1 ? <Link className="btn btn-secondary" href={principalPrevLink}>Previous</Link> : <span className="muted">Previous</span>}
          <span>Page {principalsListResult.page} / {Math.max(principalsListResult.totalPages, 1)}</span>
          {principalsListResult.page < principalsListResult.totalPages ? <Link className="btn btn-secondary" href={principalNextLink}>Next</Link> : <span className="muted">Next</span>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <div>
            <p className="eyebrow">Projects</p>
            <h2>Project list</h2>
          </div>
        </div>
        <SectionError error={projectsResult.error} />
        {projects.length === 0 ? (
          <div className="empty-state">No projects yet.</div>
        ) : (
          <ul className="compact-list">
            {projects.map((project) => <li key={project.id}>{project.name}</li>)}
          </ul>
        )}
      </section>

      <GTDStateSection tasks={tasks} />
    </main>
  );
}
