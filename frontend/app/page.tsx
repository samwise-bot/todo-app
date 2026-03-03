import Link from 'next/link';

import { createProjectAction } from './actions';
import { TASK_STATES } from '../lib/task-states';
import { buildBoardLaneView } from '../lib/board-lanes';
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

type ListFetchResult<T> = {
  items: T[];
  error: string | null;
};

type PagedListFetchResult<T> = ListFetchResult<T> & {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

async function fetchCollection<T>(path: string, label: string): Promise<ListFetchResult<T>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}${path}`, { cache: 'no-store' });
    if (!res.ok) {
      return { items: [], error: `${label} data is unavailable (HTTP ${res.status}).` };
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      return { items: [], error: `${label} data is malformed.` };
    }
    return { items: data, error: null };
  } catch {
    return { items: [], error: `${label} data request failed.` };
  }
}

async function fetchPagedCollection<T>(path: string, label: string): Promise<PagedListFetchResult<T>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}${path}`, { cache: 'no-store' });
    if (!res.ok) {
      return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0, error: `${label} data is unavailable (HTTP ${res.status}).` };
    }
    const data = await res.json();
    if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
      return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0, error: `${label} data is malformed.` };
    }
    return {
      items: data.items,
      page: Number(data.page) || 1,
      pageSize: Number(data.pageSize) || 20,
      totalItems: Number(data.totalItems) || 0,
      totalPages: Number(data.totalPages) || 0,
      error: null
    };
  } catch {
    return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0, error: `${label} data request failed.` };
  }
}

function withQueryString(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

export default async function HomePage({ searchParams }: { searchParams?: SearchParamsInput }) {
  const currentParams = toURLSearchParams(searchParams);

  const principalKind = readStringParam(currentParams, 'principalKind', '');
  const principalQ = readStringParam(currentParams, 'principalQ', '');
  const principalPage = readPositiveIntParam(currentParams, 'principalPage', 1);
  const principalPageSize = readPositiveIntParam(currentParams, 'principalPageSize', 10);

  const taskState = readStringParam(currentParams, 'taskState', '');
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
  if (taskState) {
    taskAPIQuery.set('state', taskState);
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
    fetchCollection<any>('/api/projects', 'Projects'),
    fetchPagedCollection<any>('/api/principals?page=1&pageSize=1000', 'Principals'),
    fetchPagedCollection<any>(`/api/principals?${principalAPIQuery.toString()}`, 'Principals'),
    fetchCollection<any>('/api/boards', 'Boards'),
    fetchCollection<any>('/api/columns', 'Columns'),
    fetchPagedCollection<any>('/api/tasks?page=1&pageSize=1000', 'Tasks'),
    fetchPagedCollection<any>(`/api/tasks?${taskAPIQuery.toString()}`, 'Tasks')
  ]);

  const projects = projectsResult.items;
  const principals = principalsAllResult.items;
  const principalList = principalsListResult.items;
  const boards = boardsResult.items;
  const columns = columnsResult.items;
  const tasks = tasksAllResult.items;
  const taskList = tasksListResult.items;

  const laneView = buildBoardLaneView({
    boards,
    columns,
    tasks,
    fetchErrors: [boardsResult.error, columnsResult.error, tasksAllResult.error].filter((error): error is string => Boolean(error))
  });

  const columnsByBoard = new Map<number, any[]>();
  for (const column of columns) {
    const bucket = columnsByBoard.get(column.boardId) ?? [];
    bucket.push(column);
    columnsByBoard.set(column.boardId, bucket);
  }

  const boardsByID = new Map<number, any>();
  for (const board of boards) {
    boardsByID.set(board.id, board);
  }

  const taskColumns = columns.map((column: any) => {
    const boardName = boardsByID.get(column.boardId)?.name ?? `Board ${column.boardId}`;
    return { id: column.id, label: `${boardName} / ${column.name}` };
  });

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
    <main style={{ maxWidth: 980, margin: '2rem auto', fontFamily: 'Inter, sans-serif', padding: '0 1rem' }}>
      <h1>GTD + Kanban TODO App</h1>
      <p>Bootstrap UI showing live data from Go API.</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        <form action={createProjectAction} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h2>Create project</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            <input name="name" placeholder="Project name" required />
            <input name="description" placeholder="Description" />
            <button type="submit">Create project</button>
          </div>
        </form>

        <CreateTaskForm projects={projects} taskColumns={taskColumns} />
        <CreatePrincipalForm />
      </section>

      <section>
        <h2>Projects</h2>
        <ul>
          {projects.map((p: any) => <li key={p.id}>{p.name}</li>)}
        </ul>
      </section>

      <section>
        <h2>Principals</h2>
        <form method="GET" style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 10 }}>
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
          <Link href={principalResetLink}>Reset</Link>
        </form>

        <p style={{ marginTop: 0 }}>
          Showing {principalList.length} of {principalsListResult.totalItems} principals.
        </p>
        <ul>
          {principalList.map((p: any) => (
            <li key={p.id}>
              {p.displayName} ({p.kind}) - @{p.handle}
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {principalPage > 1 ? <Link href={principalPrevLink}>Previous</Link> : <span>Previous</span>}
          <span>Page {principalsListResult.page} / {Math.max(principalsListResult.totalPages, 1)}</span>
          {principalsListResult.page < principalsListResult.totalPages ? <Link href={principalNextLink}>Next</Link> : <span>Next</span>}
        </div>
      </section>

      <section>
        <h2>Tasks</h2>
        <form method="GET" style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 10 }}>
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
          <Link href={taskResetLink}>Reset</Link>
        </form>

        <p style={{ marginTop: 0 }}>
          Showing {taskList.length} of {tasksListResult.totalItems} tasks.
        </p>
        <ul>
          {taskList.map((t: any) => (
            <li key={t.id} style={{ marginBottom: 12 }}>
              <strong>{t.title}</strong> - {t.state}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                <TransitionTaskStateForm task={t} />
                <AssignTaskForm task={t} principals={principals} />
                <SetTaskBoardColumnForm task={t} taskColumns={taskColumns} />
              </div>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {taskPage > 1 ? <Link href={taskPrevLink}>Previous</Link> : <span>Previous</span>}
          <span>Page {tasksListResult.page} / {Math.max(tasksListResult.totalPages, 1)}</span>
          {tasksListResult.page < tasksListResult.totalPages ? <Link href={taskNextLink}>Next</Link> : <span>Next</span>}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Board management</h2>
        <CreateBoardForm projects={projects} />

        {boards.map((board: any) => (
          <article key={board.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <h3>{board.name}</h3>
            <UpdateBoardForm board={board} />
            <DeleteBoardForm boardId={board.id} />

            <CreateColumnForm boardId={board.id} />

            <ul style={{ marginTop: 10 }}>
              {(columnsByBoard.get(board.id) ?? []).map((column: any) => (
                <li key={column.id} style={{ marginBottom: 8 }}>
                  <UpdateColumnForm column={column} />
                  <DeleteColumnForm columnId={column.id} />
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2>Kanban lanes (by board columns)</h2>
        {laneView.fetchErrors.length > 0 && (
          <div style={{ marginBottom: 12, border: '1px solid #b00020', borderRadius: 8, padding: 10, background: '#fff3f5' }}>
            <strong>Board lanes are incomplete due to data loading errors.</strong>
            <ul style={{ marginBottom: 0 }}>
              {laneView.fetchErrors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        <div style={{ marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
          <h3>No column</h3>
          {laneView.tasksWithoutColumn.length === 0 ? (
            <p style={{ marginBottom: 0 }}>No tasks without a board column.</p>
          ) : (
            <ul>
              {laneView.tasksWithoutColumn.map((task: any) => <li key={task.id}>{task.title} ({task.state})</li>)}
            </ul>
          )}
        </div>
        {laneView.boards.map((board: any) => (
          <article key={board.id} style={{ marginBottom: 12 }}>
            <h3>{board.name}</h3>
            {board.columns.length === 0 ? (
              <div style={{ border: '1px dashed #bbb', borderRadius: 8, padding: 10 }}>
                No columns defined for this board.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {board.columns.map((column: any) => (
                  <div key={column.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                    <h4 style={{ marginTop: 0 }}>{column.name}</h4>
                    {column.tasks.length === 0 ? (
                      <p style={{ marginBottom: 0 }}>No tasks in this column.</p>
                    ) : (
                      <ul>
                        {column.tasks.map((task: any) => <li key={task.id}>{task.title} ({task.state})</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
        {boards.length === 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
            No boards yet.
          </div>
        )}
        {boards.length > 0 && columns.length === 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
            Boards exist but no columns are defined yet.
          </div>
        )}
        {boards.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
            Tasks appear in board lanes only when assigned to a board column.
          </div>
        )}
      </section>

      <section>
        <h2>Task states</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {TASK_STATES.map((lane) => (
            <div key={lane} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
              <h3 style={{ textTransform: 'capitalize' }}>{lane}</h3>
              <ul>
                {tasks.filter((t: any) => t.state === lane).map((t: any) => <li key={t.id}>{t.title}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
