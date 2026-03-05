import Link from 'next/link';
import React from 'react';

import { createProjectAction } from './actions';
import { TASK_STATES } from '../lib/task-states';
import { buildBoardLaneView } from '../lib/board-lanes';
import { buildBoardInspectorMetrics } from '../lib/board-inspector';
import { fetchCollection, fetchPagedCollection } from '../lib/api-client';
import { boardFilterPresets, buildPresetHref } from '../lib/board-filter-presets';
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
  priority?: number | null;
  dueAt?: string | null;
};

function withQueryString(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `/board?${query}` : '/board';
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
  const taskPriority = readStringParam(currentParams, 'taskPriority', '');
  const taskDueWindow = readStringParam(currentParams, 'taskDueWindow', '');
  const taskPage = readPositiveIntParam(currentParams, 'taskPage', 1);
  const taskPageSize = readPositiveIntParam(currentParams, 'taskPageSize', 10);
  const columnMoveNotice = readStringParam(currentParams, 'columnMoveNotice', '');

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

  const priorityFilter = taskPriority ? Number(taskPriority) : null;
  const dueWindowHours = taskDueWindow ? Number(taskDueWindow) : null;
  const nowMs = Date.now();
  const dueWindowLimitMs = Number.isFinite(dueWindowHours) && dueWindowHours && dueWindowHours > 0
    ? nowMs + dueWindowHours * 60 * 60 * 1000
    : null;

  const matchesTaskFilters = (task: Task): boolean => {
    if (taskStates.length > 0 && !taskStates.includes(task.state as (typeof TASK_STATES)[number])) {
      return false;
    }
    if (taskProjectId && String(task.projectId ?? '') !== taskProjectId) {
      return false;
    }
    if (taskAssigneeId && String(task.assigneeId ?? '') !== taskAssigneeId) {
      return false;
    }
    if (taskBoardColumnId && String(task.boardColumnId ?? '') !== taskBoardColumnId) {
      return false;
    }
    if (priorityFilter !== null && Number.isFinite(priorityFilter) && (task.priority ?? 3) !== priorityFilter) {
      return false;
    }
    if (taskQ) {
      const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase();
      if (!haystack.includes(taskQ.toLowerCase())) {
        return false;
      }
    }
    if (dueWindowLimitMs !== null) {
      if (!task.dueAt) {
        return false;
      }
      const dueAtMs = Date.parse(task.dueAt);
      if (Number.isNaN(dueAtMs) || dueAtMs > dueWindowLimitMs) {
        return false;
      }
    }
    return true;
  };

  const filteredTasks = tasks.filter(matchesTaskFilters);
  const taskList = filteredTasks;
  const boardInspector = buildBoardInspectorMetrics(filteredTasks);

  const laneView = buildBoardLaneView({
    boards,
    columns,
    tasks: filteredTasks,
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

  const activeBoardFilterBadges: { label: string; clearHref: string }[] = [];
  if (taskAssigneeId) {
    const principal = principalByID.get(Number(taskAssigneeId));
    activeBoardFilterBadges.push({
      label: `Assignee: ${principal?.displayName ?? `#${taskAssigneeId}`}`,
      clearHref: withQueryString(updateSearchParams(currentParams, { taskAssigneeId: null, taskPage: null }))
    });
  }
  if (taskProjectId) {
    const project = projectByID.get(Number(taskProjectId));
    activeBoardFilterBadges.push({
      label: `Project: ${project?.name ?? `#${taskProjectId}`}`,
      clearHref: withQueryString(updateSearchParams(currentParams, { taskProjectId: null, taskPage: null }))
    });
  }
  if (taskState) {
    activeBoardFilterBadges.push({
      label: `State: ${taskState}`,
      clearHref: withQueryString(updateSearchParams(currentParams, { taskState: null, taskPage: null }))
    });
  }
  if (taskPriority) {
    activeBoardFilterBadges.push({
      label: `Priority: P${taskPriority}`,
      clearHref: withQueryString(updateSearchParams(currentParams, { taskPriority: null, taskPage: null }))
    });
  }
  if (taskDueWindow) {
    const dueWindowLabel =
      taskDueWindow === '24' ? '24h' : taskDueWindow === '72' ? '3d' : taskDueWindow === '168' ? '7d' : `${taskDueWindow}h`;
    activeBoardFilterBadges.push({
      label: `Due: ${dueWindowLabel}`,
      clearHref: withQueryString(updateSearchParams(currentParams, { taskDueWindow: null, taskPage: null }))
    });
  }
  if (taskQ) {
    activeBoardFilterBadges.push({
      label: `Search: ${taskQ}`,
      clearHref: withQueryString(updateSearchParams(currentParams, { taskQ: null, taskPage: null }))
    });
  }

  const principalHidden = hiddenParamEntries(currentParams, ['principalKind', 'principalQ', 'principalPage', 'principalPageSize']);
  const taskHidden = hiddenParamEntries(currentParams, ['taskState', 'taskQ', 'taskProjectId', 'taskAssigneeId', 'taskBoardColumnId', 'taskPriority', 'taskDueWindow', 'taskPage', 'taskPageSize']);

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
    taskPriority: null,
    taskDueWindow: null,
    taskPage: null,
    taskPageSize: null
  }));
  const boardPresetLinks = boardFilterPresets().map((preset) => ({
    ...preset,
    href: buildPresetHref(currentParams, preset)
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

        <div id="quick-create-task">
          <CreateTaskForm projects={projects} taskColumns={taskColumns} />
        </div>
        <CreatePrincipalForm />
      </section>

      <BoardLanesSection
        laneView={laneView}
        boards={boards}
        columns={columns}
        principals={principals}
        projects={projects}
        activeFilterBadges={activeBoardFilterBadges}
        presetLinks={boardPresetLinks}
        boardHref={withQueryString(currentParams)}
        columnMoveNotice={columnMoveNotice}
      />

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
          <span className="badge">Due soon (24h): {boardInspector.dueSoonCount}</span>
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

        <div className="badge-row" style={{ marginBottom: 10, gap: 8 }}>
          <span className="muted">Filter presets:</span>
          {boardPresetLinks.map((preset) => (
            <Link key={preset.key} className="btn btn-secondary" href={preset.href}>{preset.label}</Link>
          ))}
        </div>

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
          <select name="taskPriority" defaultValue={taskPriority}>
            <option value="">Any priority</option>
            <option value="1">P1</option>
            <option value="2">P2</option>
            <option value="3">P3</option>
          </select>
          <select name="taskDueWindow" defaultValue={taskDueWindow}>
            <option value="">Any due window</option>
            <option value="24">Due in 24h</option>
            <option value="72">Due in 3d</option>
            <option value="168">Due in 7d</option>
          </select>
          <select name="taskPageSize" defaultValue={String(taskPageSize)}>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
          <button type="submit">Apply</button>
          <Link className="btn btn-secondary" href={taskResetLink}>Reset</Link>
        </form>

        <p className="muted" style={{ marginTop: 10 }}>
          Showing {taskList.length} of {tasks.length} tasks.
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
          <span className="muted">Board-first filter mode uses in-memory matching to keep board lanes + explorer in sync.</span>
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
