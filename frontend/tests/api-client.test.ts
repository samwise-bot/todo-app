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
  afterEach(() => {
    vi.restoreAllMocks();
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
});

describe('fetchPagedCollection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
