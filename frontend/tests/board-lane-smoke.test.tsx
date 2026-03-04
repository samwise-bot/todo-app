import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

const { revalidatePathMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn()
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock
}));

import {
  createBoardAction,
  createColumnAction,
  createProjectAction,
  createTaskAction,
  setTaskBoardColumnAction
} from '../app/actions';
import { INITIAL_ACTION_STATE } from '../lib/action-state';
import { BoardLanesSection } from '../app/ui/board-lanes-section';
import { buildBoardLaneView } from '../lib/board-lanes';
import { fetchCollection, fetchPagedCollection } from '../lib/api-client';

type Project = { id: number; name: string; description: string };
type Board = { id: number; projectId: number; name: string };
type Column = { id: number; boardId: number; name: string; position: number };
type Task = {
  id: number;
  title: string;
  description: string;
  state: string;
  projectId: number | null;
  boardColumnId: number | null;
};

type FakeStore = {
  projects: Project[];
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  nextID: number;
};

function makeJSONResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as unknown as Response;
}

function formData(entries: Array<[string, string]>) {
  const data = new FormData();
  for (const [key, value] of entries) {
    data.set(key, value);
  }
  return data;
}

function setupStatefulAPI() {
  const store: FakeStore = {
    projects: [],
    boards: [],
    columns: [],
    tasks: [],
    nextID: 1
  };

  const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const method = init?.method ?? 'GET';
    const rawBody = typeof init?.body === 'string' ? init.body : '';
    const body = rawBody ? JSON.parse(rawBody) : {};

    const target = typeof input === 'string' ? input : input.url;
    const url = new URL(target);
    const path = url.pathname;

    if (path === '/api/projects' && method === 'POST') {
      const project: Project = {
        id: store.nextID++,
        name: String(body.name ?? ''),
        description: String(body.description ?? '')
      };
      store.projects.push(project);
      return makeJSONResponse(201, project);
    }

    if (path === '/api/boards' && method === 'POST') {
      const board: Board = {
        id: store.nextID++,
        projectId: Number(body.projectId),
        name: String(body.name ?? '')
      };
      store.boards.unshift(board);
      return makeJSONResponse(201, board);
    }

    if (path === '/api/boards' && method === 'GET') {
      return makeJSONResponse(200, [...store.boards]);
    }

    if (path === '/api/columns' && method === 'POST') {
      const column: Column = {
        id: store.nextID++,
        boardId: Number(body.boardId),
        name: String(body.name ?? ''),
        position: Number(body.position ?? 0)
      };
      store.columns.push(column);
      store.columns.sort((a, b) => a.position - b.position || a.id - b.id);
      return makeJSONResponse(201, column);
    }

    if (path === '/api/columns' && method === 'GET') {
      return makeJSONResponse(200, [...store.columns]);
    }

    if (path === '/api/tasks' && method === 'POST') {
      const task: Task = {
        id: store.nextID++,
        title: String(body.title ?? ''),
        description: String(body.description ?? ''),
        state: String(body.state ?? 'inbox'),
        projectId: body.projectId ? Number(body.projectId) : null,
        boardColumnId: body.boardColumnId ? Number(body.boardColumnId) : null
      };
      store.tasks.unshift(task);
      return makeJSONResponse(201, task);
    }

    if (path === '/api/tasks' && method === 'GET') {
      return makeJSONResponse(200, {
        items: [...store.tasks],
        page: 1,
        pageSize: 1000,
        totalItems: store.tasks.length,
        totalPages: 1
      });
    }

    const boardColumnMatch = path.match(/^\/api\/tasks\/(\d+)\/board-column$/);
    if (boardColumnMatch && method === 'PATCH') {
      const taskID = Number(boardColumnMatch[1]);
      const task = store.tasks.find((candidate) => candidate.id === taskID);
      if (!task) {
        return makeJSONResponse(404, { error: 'task not found' });
      }
      task.boardColumnId = body.boardColumnId == null ? null : Number(body.boardColumnId);
      return makeJSONResponse(200, { ok: true });
    }

    return makeJSONResponse(404, { error: `unhandled route: ${method} ${path}` });
  });

  return { store, fetchMock };
}

describe('board-lane smoke flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    revalidatePathMock.mockReset();
  });

  test('creates board/column/task, assigns lane, and keeps API/UI in parity', async () => {
    const { fetchMock } = setupStatefulAPI();

    await createProjectAction(formData([
      ['name', 'Delivery'],
      ['description', 'release train']
    ]));

    const createBoardResult = await createBoardAction(INITIAL_ACTION_STATE, formData([
      ['name', 'Execution'],
      ['projectId', '1']
    ]));
    expect(createBoardResult.status).toBe('success');

    const createColumnResult = await createColumnAction(INITIAL_ACTION_STATE, formData([
      ['name', 'Doing'],
      ['boardId', '2'],
      ['position', '1']
    ]));
    expect(createColumnResult.status).toBe('success');

    const createTaskResult = await createTaskAction(INITIAL_ACTION_STATE, formData([
      ['title', 'Ship release'],
      ['description', 'v1.0.0'],
      ['state', 'next'],
      ['projectId', '1']
    ]));
    expect(createTaskResult.status).toBe('success');

    const assignLaneResult = await setTaskBoardColumnAction(INITIAL_ACTION_STATE, formData([
      ['taskId', '4'],
      ['boardColumnId', '3']
    ]));
    expect(assignLaneResult.status).toBe('success');

    const boardsRes = await fetch('http://localhost:8080/api/boards', { cache: 'no-store' });
    const boards = await boardsRes.json();

    const columnsRes = await fetch('http://localhost:8080/api/columns', { cache: 'no-store' });
    const columns = await columnsRes.json();

    const tasksRes = await fetch('http://localhost:8080/api/tasks?page=1&pageSize=1000', { cache: 'no-store' });
    const taskPayload = await tasksRes.json();
    const tasks = taskPayload.items;

    expect(tasks).toHaveLength(1);
    expect(tasks[0].boardColumnId).toBe(3);

    const laneView = buildBoardLaneView({ boards, columns, tasks, fetchErrors: [] });
    expect(laneView.tasksWithoutColumn).toHaveLength(0);
    expect(laneView.boards[0].columns[0].tasks).toHaveLength(1);
    expect(laneView.boards[0].columns[0].tasks[0].id).toBe(tasks[0].id);

    const html = renderToStaticMarkup(
      <BoardLanesSection laneView={laneView} boards={boards} columns={columns} principals={[]} projects={[]} />
    );

    expect(html).toContain('Execution');
    expect(html).toContain('Doing');
    expect(html).toContain('Ship release');
    expect(html).toContain('next');
    expect(html).toContain('draggable="true"');
    expect(html).toContain('data-task-id="4"');

    expect(fetchMock).toHaveBeenCalled();
  });

  test('keeps board-lane rendering stable when boards use { data } while peers use { items }', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const target = typeof input === 'string' ? input : input.url;
      const url = new URL(target);

      if (url.pathname === '/api/boards') {
        return makeJSONResponse(200, { data: [{ id: 2, projectId: 1, name: 'Execution' }] });
      }
      if (url.pathname === '/api/columns') {
        return makeJSONResponse(200, { items: [{ id: 21, boardId: 2, name: 'Doing', position: 1 }] });
      }
      if (url.pathname === '/api/tasks') {
        return makeJSONResponse(200, {
          items: [{ id: 301, title: 'Ship release', description: '', state: 'next', projectId: 1, boardColumnId: 21 }],
          page: 1,
          pageSize: 1000,
          totalItems: 1,
          totalPages: 1
        });
      }

      throw new Error(`unhandled route: ${url.pathname}${url.search}`);
    });

    const boardsResult = await fetchCollection<{ id: number; projectId: number; name: string }>('/api/boards', 'Boards');
    const columnsResult = await fetchCollection<{ id: number; boardId: number; name: string; position: number }>(
      '/api/columns',
      'Columns'
    );
    const tasksResult = await fetchPagedCollection<{
      id: number;
      title: string;
      description: string;
      state: string;
      projectId: number | null;
      boardColumnId: number | null;
    }>('/api/tasks?page=1&pageSize=1000', 'Tasks');

    expect(boardsResult.error).toBeNull();
    expect(columnsResult.error).toBeNull();
    expect(tasksResult.error).toBeNull();

    const laneView = buildBoardLaneView({
      boards: boardsResult.items,
      columns: columnsResult.items,
      tasks: tasksResult.items,
      fetchErrors: [boardsResult.error, columnsResult.error, tasksResult.error].filter(
        (error): error is string => Boolean(error)
      )
    });
    const html = renderToStaticMarkup(
      <BoardLanesSection
        laneView={laneView}
        boards={boardsResult.items}
        columns={columnsResult.items}
        principals={[]}
        projects={[]}
      />
    );

    expect(html).toContain('Execution');
    expect(html).toContain('Doing');
    expect(html).toContain('Ship release');
    expect(html).not.toContain('Board lanes are incomplete due to data loading issues.');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
