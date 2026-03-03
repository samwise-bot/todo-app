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
