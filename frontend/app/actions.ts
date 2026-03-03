'use server';

import { revalidatePath } from 'next/cache';

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
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
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

export async function createTaskAction(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const state = String(formData.get('state') ?? 'inbox').trim() || 'inbox';
  const projectIdRaw = String(formData.get('projectId') ?? '').trim();
  if (!title) return;

  const payload: Record<string, unknown> = {
    title,
    description,
    state
  };
  if (projectIdRaw) {
    payload.projectId = Number(projectIdRaw);
  }

  await apiFetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  revalidatePath('/');
}

export async function transitionTaskStateAction(formData: FormData) {
  const taskIdRaw = String(formData.get('taskId') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  if (!taskIdRaw || !state) return;

  await apiFetch(`/api/tasks/${taskIdRaw}/state`, {
    method: 'PATCH',
    body: JSON.stringify({ state })
  });
  revalidatePath('/');
}

export async function createPrincipalAction(formData: FormData) {
  const kind = String(formData.get('kind') ?? '').trim();
  const handle = String(formData.get('handle') ?? '').trim();
  const displayName = String(formData.get('displayName') ?? '').trim();
  if (!kind || !handle || !displayName) return;

  await apiFetch('/api/principals', {
    method: 'POST',
    body: JSON.stringify({ kind, handle, displayName })
  });
  revalidatePath('/');
}

export async function assignTaskAction(formData: FormData) {
  const taskIdRaw = String(formData.get('taskId') ?? '').trim();
  const assigneeIdRaw = String(formData.get('assigneeId') ?? '').trim();
  if (!taskIdRaw) return;
  const taskID = Number(taskIdRaw);
  if (!Number.isInteger(taskID) || taskID <= 0) return;

  const payload: { assigneeId: number | null } = { assigneeId: null };
  if (assigneeIdRaw) {
    const assigneeID = Number(assigneeIdRaw);
    if (!Number.isInteger(assigneeID) || assigneeID <= 0) return;
    payload.assigneeId = assigneeID;
  }

  await apiFetch(`/api/tasks/${taskID}/assignee`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  revalidatePath('/');
}

export async function createBoardAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const projectIdRaw = String(formData.get('projectId') ?? '').trim();
  if (!name || !projectIdRaw) return;
  const projectID = Number(projectIdRaw);
  if (!Number.isInteger(projectID) || projectID <= 0) return;

  await apiFetch('/api/boards', {
    method: 'POST',
    body: JSON.stringify({ name, projectId: projectID })
  });
  revalidatePath('/');
}

export async function updateBoardAction(formData: FormData) {
  const boardIdRaw = String(formData.get('boardId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  if (!boardIdRaw || !name) return;
  const boardID = Number(boardIdRaw);
  if (!Number.isInteger(boardID) || boardID <= 0) return;

  await apiFetch(`/api/boards/${boardID}`, {
    method: 'PATCH',
    body: JSON.stringify({ name })
  });
  revalidatePath('/');
}

export async function deleteBoardAction(formData: FormData) {
  const boardIdRaw = String(formData.get('boardId') ?? '').trim();
  if (!boardIdRaw) return;
  const boardID = Number(boardIdRaw);
  if (!Number.isInteger(boardID) || boardID <= 0) return;

  await apiFetch(`/api/boards/${boardID}`, {
    method: 'DELETE',
    body: JSON.stringify({})
  });
  revalidatePath('/');
}

export async function createColumnAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const boardIdRaw = String(formData.get('boardId') ?? '').trim();
  const positionRaw = String(formData.get('position') ?? '').trim();
  if (!name || !boardIdRaw) return;
  const boardID = Number(boardIdRaw);
  const position = positionRaw ? Number(positionRaw) : 0;
  if (!Number.isInteger(boardID) || boardID <= 0) return;
  if (!Number.isInteger(position)) return;

  await apiFetch('/api/columns', {
    method: 'POST',
    body: JSON.stringify({ name, boardId: boardID, position })
  });
  revalidatePath('/');
}

export async function updateColumnAction(formData: FormData) {
  const columnIdRaw = String(formData.get('columnId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const positionRaw = String(formData.get('position') ?? '').trim();
  if (!columnIdRaw || !name || !positionRaw) return;
  const columnID = Number(columnIdRaw);
  const position = Number(positionRaw);
  if (!Number.isInteger(columnID) || columnID <= 0) return;
  if (!Number.isInteger(position)) return;

  await apiFetch(`/api/columns/${columnID}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, position })
  });
  revalidatePath('/');
}

export async function deleteColumnAction(formData: FormData) {
  const columnIdRaw = String(formData.get('columnId') ?? '').trim();
  if (!columnIdRaw) return;
  const columnID = Number(columnIdRaw);
  if (!Number.isInteger(columnID) || columnID <= 0) return;

  await apiFetch(`/api/columns/${columnID}`, {
    method: 'DELETE',
    body: JSON.stringify({})
  });
  revalidatePath('/');
}
