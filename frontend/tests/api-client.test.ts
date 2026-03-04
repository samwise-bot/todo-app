import { afterEach, describe, expect, test, vi } from 'vitest';

import { fetchCollection, fetchPagedCollection } from '../lib/api-client';

function okJSONResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body
  } as unknown as Response;
}

describe('fetchCollection', () => {
  const originalSWR = process.env.TODO_APP_SWR_SECONDS;
  const originalHotSWR = process.env.TODO_APP_SWR_HOT_SECONDS;
  const originalWarmSWR = process.env.TODO_APP_SWR_WARM_SECONDS;
  const originalColdSWR = process.env.TODO_APP_SWR_COLD_SECONDS;

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.TODO_APP_SWR_SECONDS = originalSWR;
    process.env.TODO_APP_SWR_HOT_SECONDS = originalHotSWR;
    process.env.TODO_APP_SWR_WARM_SECONDS = originalWarmSWR;
    process.env.TODO_APP_SWR_COLD_SECONDS = originalColdSWR;
  });

  test('accepts common collection envelope shapes', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(okJSONResponse({ data: [{ id: 1 }, { id: 2 }] }))
      .mockResolvedValueOnce(okJSONResponse({ data: { items: [{ id: 3 }] } }))
      .mockResolvedValueOnce(okJSONResponse({ results: [{ id: 4 }] }));

    await expect(fetchCollection<{ id: number }>('/api/boards', 'Boards')).resolves.toEqual({
      items: [{ id: 1 }, { id: 2 }],
      error: null
    });
    await expect(fetchCollection<{ id: number }>('/api/boards', 'Boards')).resolves.toEqual({
      items: [{ id: 3 }],
      error: null
    });
    await expect(fetchCollection<{ id: number }>('/api/boards', 'Boards')).resolves.toEqual({
      items: [{ id: 4 }],
      error: null
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('keeps malformed payload fallback for invalid data', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(okJSONResponse({ data: { values: [1, 2] } }));

    await expect(fetchCollection('/api/boards', 'Boards')).resolves.toEqual({
      items: [],
      error: 'Boards data is malformed.'
    });
  });

  test('uses stale-while-revalidate fetch options by default', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okJSONResponse([]));

    await fetchCollection('/api/boards', 'Boards');

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/boards', {
      cache: 'force-cache',
      next: { revalidate: 30 }
    });
  });

  test('uses cache tier overrides by endpoint type', async () => {
    process.env.TODO_APP_SWR_SECONDS = '30';
    process.env.TODO_APP_SWR_HOT_SECONDS = '20';
    process.env.TODO_APP_SWR_WARM_SECONDS = '180';
    process.env.TODO_APP_SWR_COLD_SECONDS = '900';
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okJSONResponse([]));

    await fetchCollection('/api/tasks?page=1', 'Tasks');
    await fetchCollection('/api/projects', 'Projects');
    await fetchCollection('/api/reviews/weekly', 'Review');

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:8080/api/tasks?page=1', {
      cache: 'force-cache',
      next: { revalidate: 20 }
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:8080/api/projects', {
      cache: 'force-cache',
      next: { revalidate: 180 }
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'http://localhost:8080/api/reviews/weekly', {
      cache: 'force-cache',
      next: { revalidate: 900 }
    });
  });

  test('disables cache when TODO_APP_SWR_SECONDS is zero', async () => {
    process.env.TODO_APP_SWR_SECONDS = '0';
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okJSONResponse([]));

    await fetchCollection('/api/boards', 'Boards');

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/boards', { cache: 'no-store' });
  });
});

describe('fetchPagedCollection', () => {
  const originalSWR = process.env.TODO_APP_SWR_SECONDS;

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.TODO_APP_SWR_SECONDS = originalSWR;
  });

  test('accepts nested results.items envelopes and metadata', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      okJSONResponse({
        results: { items: [{ id: 21 }, { id: 22 }] },
        page: 2,
        pageSize: 5,
        totalItems: 12,
        totalPages: 3
      })
    );

    await expect(fetchPagedCollection<{ id: number }>('/api/tasks', 'Tasks')).resolves.toEqual({
      items: [{ id: 21 }, { id: 22 }],
      page: 2,
      pageSize: 5,
      totalItems: 12,
      totalPages: 3,
      error: null
    });
  });

  test('falls back to derived pagination for array payloads', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(okJSONResponse([{ id: 1 }, { id: 2 }, { id: 3 }]));

    await expect(fetchPagedCollection<{ id: number }>('/api/tasks', 'Tasks')).resolves.toEqual({
      items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      page: 1,
      pageSize: 3,
      totalItems: 3,
      totalPages: 1,
      error: null
    });
  });
});
