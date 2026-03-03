import { describe, expect, test, vi } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock
}));

import HomePage from '../app/page';

describe('home page routing', () => {
  test('redirects the root route to /board', () => {
    HomePage();
    expect(redirectMock).toHaveBeenCalledWith('/board');
  });
});
