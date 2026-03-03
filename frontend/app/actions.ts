'use server';

import { revalidatePath } from 'next/cache';
import {
  actionErrorMessage,
  failureActionState,
  successActionState,
  validationErrorState,
  type ActionState
} from '../lib/action-state';
import { TASK_STATES } from '../lib/task-states';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

async function apiFetch(path: string, init: RequestInit) {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    const text = (await res.text()).trim();
    throw new Error(text || `API request failed with status ${res.status}`);
  }
}

function asPositiveInt(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

async function runAction(successMessage: string, fn: () => Promise<void>): Promise<ActionState> {
  try {
    await fn();
    revalidatePath('/');
    return successActionState(successMessage);
  } catch (error) {
    return failureActionState(actionErrorMessage(error));
  }
}

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!name) return;

  await apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description })
  });
  revalidatePath('/');
}

export async function createTaskAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const state = String(formData.get('state') ?? 'inbox').trim() || 'inbox';
  const projectIdRaw = String(formData.get('projectId') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  if (!title) {
    fieldErrors.title = 'Title is required.';
  }
  if (!TASK_STATES.includes(state as (typeof TASK_STATES)[number])) {
    fieldErrors.state = 'State is invalid.';
  }

  let projectId: number | undefined;
  if (projectIdRaw) {
    const parsedProjectId = asPositiveInt(projectIdRaw);
    if (parsedProjectId === null) {
      fieldErrors.projectId = 'Project is invalid.';
    } else {
      projectId = parsedProjectId;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return validationErrorState(fieldErrors);
  }

  return runAction('Task created.', async () => {
    const payload: Record<string, unknown> = {
      title,
      description,
      state
    };
    if (projectId !== undefined) {
      payload.projectId = projectId;
    }
    await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  });
}

export async function transitionTaskStateAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const taskIdRaw = String(formData.get('taskId') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  const taskId = asPositiveInt(taskIdRaw);
  if (taskId === null) {
    fieldErrors.taskId = 'Task is invalid.';
  }
  if (!TASK_STATES.includes(state as (typeof TASK_STATES)[number])) {
    fieldErrors.state = 'State is invalid.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return validationErrorState(fieldErrors);
  }

  return runAction('Task updated.', async () => {
    await apiFetch(`/api/tasks/${taskId}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ state })
    });
  });
}

export async function createPrincipalAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const kind = String(formData.get('kind') ?? '').trim();
  const handle = String(formData.get('handle') ?? '').trim();
  const displayName = String(formData.get('displayName') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  if (!kind) {
    fieldErrors.kind = 'Kind is required.';
  }
  if (!handle) {
    fieldErrors.handle = 'Handle is required.';
  }
  if (!displayName) {
    fieldErrors.displayName = 'Display name is required.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return validationErrorState(fieldErrors);
  }

  return runAction('Principal created.', async () => {
    await apiFetch('/api/principals', {
      method: 'POST',
      body: JSON.stringify({ kind, handle, displayName })
    });
  });
}

export async function assignTaskAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const taskIdRaw = String(formData.get('taskId') ?? '').trim();
  const assigneeIdRaw = String(formData.get('assigneeId') ?? '').trim();

  const taskID = asPositiveInt(taskIdRaw);
  if (taskID === null) {
    return validationErrorState({ taskId: 'Task is invalid.' });
  }

  const payload: { assigneeId: number | null } = { assigneeId: null };
  if (assigneeIdRaw) {
    const assigneeID = asPositiveInt(assigneeIdRaw);
    if (assigneeID === null) {
      return validationErrorState({ assigneeId: 'Assignee is invalid.' });
    }
    payload.assigneeId = assigneeID;
  }

  return runAction(payload.assigneeId === null ? 'Task unassigned.' : 'Task assigned.', async () => {
    await apiFetch(`/api/tasks/${taskID}/assignee`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  });
}

export async function createBoardAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const projectIdRaw = String(formData.get('projectId') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  if (!name) {
    fieldErrors.name = 'Board name is required.';
  }
  const projectID = asPositiveInt(projectIdRaw);
  if (projectID === null) {
    fieldErrors.projectId = 'Project is required.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return validationErrorState(fieldErrors);
  }

  return runAction('Board created.', async () => {
    await apiFetch('/api/boards', {
      method: 'POST',
      body: JSON.stringify({ name, projectId: projectID })
    });
  });
}

export async function updateBoardAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const boardIdRaw = String(formData.get('boardId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  const boardID = asPositiveInt(boardIdRaw);
  if (boardID === null) {
    fieldErrors.boardId = 'Board is invalid.';
  }
  if (!name) {
    fieldErrors.name = 'Board name is required.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return validationErrorState(fieldErrors);
  }

  return runAction('Board updated.', async () => {
    await apiFetch(`/api/boards/${boardID}`, {
      method: 'PATCH',
      body: JSON.stringify({ name })
    });
  });
}

export async function deleteBoardAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const boardIdRaw = String(formData.get('boardId') ?? '').trim();
  const boardID = asPositiveInt(boardIdRaw);
  if (boardID === null) {
    return validationErrorState({ boardId: 'Board is invalid.' });
  }

  return runAction('Board deleted.', async () => {
    await apiFetch(`/api/boards/${boardID}`, {
      method: 'DELETE',
      body: JSON.stringify({})
    });
  });
}

export async function createColumnAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const boardIdRaw = String(formData.get('boardId') ?? '').trim();
  const positionRaw = String(formData.get('position') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  if (!name) {
    fieldErrors.name = 'Column name is required.';
  }
  const boardID = asPositiveInt(boardIdRaw);
  if (boardID === null) {
    fieldErrors.boardId = 'Board is invalid.';
  }

  let position = 0;
  if (positionRaw) {
    const parsed = Number(positionRaw);
    if (!Number.isInteger(parsed)) {
      fieldErrors.position = 'Position must be an integer.';
    } else {
      position = parsed;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return validationErrorState(fieldErrors);
  }

  return runAction('Column created.', async () => {
    await apiFetch('/api/columns', {
      method: 'POST',
      body: JSON.stringify({ name, boardId: boardID, position })
    });
  });
}

export async function updateColumnAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const columnIdRaw = String(formData.get('columnId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const positionRaw = String(formData.get('position') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  const columnID = asPositiveInt(columnIdRaw);
  if (columnID === null) {
    fieldErrors.columnId = 'Column is invalid.';
  }
  if (!name) {
    fieldErrors.name = 'Column name is required.';
  }

  const position = Number(positionRaw);
  if (!Number.isInteger(position)) {
    fieldErrors.position = 'Position must be an integer.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return validationErrorState(fieldErrors);
  }

  return runAction('Column updated.', async () => {
    await apiFetch(`/api/columns/${columnID}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, position })
    });
  });
}

export async function deleteColumnAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const columnIdRaw = String(formData.get('columnId') ?? '').trim();
  const columnID = asPositiveInt(columnIdRaw);
  if (columnID === null) {
    return validationErrorState({ columnId: 'Column is invalid.' });
  }

  return runAction('Column deleted.', async () => {
    await apiFetch(`/api/columns/${columnID}`, {
      method: 'DELETE',
      body: JSON.stringify({})
    });
  });
}
