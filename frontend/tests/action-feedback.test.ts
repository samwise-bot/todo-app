import { beforeEach, describe, expect, test, vi } from 'vitest';

const { revalidatePathMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn()
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock
}));

import { INITIAL_ACTION_STATE } from '../lib/action-state';
import { createPrincipalAction } from '../app/actions';

describe('createPrincipalAction feedback state', () => {
  beforeEach(() => {
    revalidatePathMock.mockReset();
    vi.restoreAllMocks();
  });

  test('returns success state and revalidates on successful submit', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('')
    } as unknown as Response);

    const formData = new FormData();
    formData.set('kind', 'human');
    formData.set('handle', 'alice');
    formData.set('displayName', 'Alice');

    const result = await createPrincipalAction(INITIAL_ACTION_STATE, formData);

    expect(result.status).toBe('success');
    expect(result.message).toBe('Principal created.');
    expect(result.fieldErrors).toEqual({});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith('/');
  });

  test('returns inline error state when API rejects submit', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      text: vi.fn().mockResolvedValue('handle already exists')
    } as unknown as Response);

    const formData = new FormData();
    formData.set('kind', 'human');
    formData.set('handle', 'alice');
    formData.set('displayName', 'Alice');

    const result = await createPrincipalAction(INITIAL_ACTION_STATE, formData);

    expect(result.status).toBe('error');
    expect(result.message).toContain('handle already exists');
    expect(result.fieldErrors).toEqual({});
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
