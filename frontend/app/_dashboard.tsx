import React from 'react';

import { TASK_STATES } from '../lib/task-states';
import { buildBoardLaneView } from '../lib/board-lanes';
import { fetchCollection, fetchPagedCollection, type PagedListFetchResult } from '../lib/api-client';
import { boardFilterPresets, buildPresetHref } from '../lib/board-filter-presets';
import {
  hiddenParamEntries,
  readPositiveIntParam,
  readStringParam,
  toURLSearchParams,
  updateSearchParams,
  type SearchParamsInput
} from '../lib/list-query';
import { BoardLanesSection } from './ui/board-lanes-section';

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

function buildPagedPath(basePath: string, page: number, pageSize: number): string {
  const url = new URL(basePath, 'http://localhost');
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));
  return `${url.pathname}?${url.searchParams.toString()}`;
}

async function fetchAllPages<T>(basePath: string, label: string, pageSize = 100, maxPages = 50): Promise<PagedListFetchResult<T>> {
  const first = await fetchPagedCollection<T>(buildPagedPath(basePath, 1, pageSize), label);
  if (first.error || first.totalPages <= 1) {
    return first;
  }

  const targetPages = Math.min(first.totalPages, maxPages);
  const items = [...first.items];

  for (let page = 2; page <= targetPages; page += 1) {
    const next = await fetchPagedCollection<T>(buildPagedPath(basePath, page, pageSize), label);
    if (next.error) {
      return {
        ...first,
        items,
        totalItems: items.length,
        totalPages: targetPages,
        error: next.error
      };
    }
    items.push(...next.items);
  }

  return {
    ...first,
    items,
    page: 1,
    pageSize,
    totalItems: items.length,
    totalPages: targetPages,
    error: null
  };
}

export default async function HomePage({ searchParams }: { searchParams?: SearchParamsInput }) {
  const currentParams = toURLSearchParams(searchParams);

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
  const columnMoveStatus = readStringParam(currentParams, 'columnMoveStatus', '');

  const [projectsResult, principalsResult, boardsResult, columnsResult, tasksResult] = await Promise.all([
    fetchCollection<Project>('/api/projects', 'Projects'),
    fetchAllPages<Principal>('/api/principals', 'Principals', 100, 10),
    fetchCollection<Board>('/api/boards', 'Boards'),
    fetchCollection<Column>('/api/columns', 'Columns'),
    fetchAllPages<Task>('/api/tasks', 'Tasks', 100, 50)
  ]);

  const projects = projectsResult.items;
  const principals = principalsResult.items;
  const boards = boardsResult.items;
  const columns = columnsResult.items;
  const tasks = tasksResult.items;

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

  const laneView = buildBoardLaneView({
    boards,
    columns,
    tasks: filteredTasks,
    fetchErrors: [boardsResult.error, columnsResult.error, tasksResult.error].filter((error): error is string => Boolean(error))
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

  const boardFilterHidden = hiddenParamEntries(currentParams, ['taskState', 'taskQ', 'taskProjectId', 'taskAssigneeId', 'taskPriority', 'taskDueWindow', 'taskPage']);

  const boardPresetLinks = boardFilterPresets().map((preset) => ({
    ...preset,
    href: buildPresetHref(currentParams, preset)
  }));

  return (
    <main className="app-shell">
      <header className="page-header">
        <h1>Board</h1>
        <p>Focused board workspace. Manage tasks, columns, and flow directly in-lane.</p>
      </header>

      <BoardLanesSection
        laneView={laneView}
        boards={boards}
        columns={columns}
        principals={principals}
        projects={projects}
        activeFilterBadges={activeBoardFilterBadges}
        presetLinks={boardPresetLinks}
        boardFilter={{
          assigneeId: taskAssigneeId,
          projectId: taskProjectId,
          state: taskState,
          priority: taskPriority,
          dueWindow: taskDueWindow,
          search: taskQ,
          assigneeOptions: principals.map((principal) => ({ id: principal.id, label: principal.displayName })),
          projectOptions: projects.map((project) => ({ id: project.id, label: project.name })),
          resetHref: withQueryString(updateSearchParams(currentParams, {
            taskState: null,
            taskQ: null,
            taskProjectId: null,
            taskAssigneeId: null,
            taskPriority: null,
            taskDueWindow: null,
            taskPage: null
          })),
          hiddenParams: boardFilterHidden,
          assigneeLabel: taskAssigneeId ? (principalByID.get(Number(taskAssigneeId))?.displayName ?? `#${taskAssigneeId}`) : '',
          assigneeClearHref: withQueryString(updateSearchParams(currentParams, { taskAssigneeId: null, taskPage: null })),
          projectLabel: taskProjectId ? (projectByID.get(Number(taskProjectId))?.name ?? `#${taskProjectId}`) : '',
          projectClearHref: withQueryString(updateSearchParams(currentParams, { taskProjectId: null, taskPage: null }))
        }}
        boardHref={withQueryString(currentParams)}
        columnMoveNotice={columnMoveNotice}
        columnMoveStatus={columnMoveStatus}
      />
    </main>
  );
}
