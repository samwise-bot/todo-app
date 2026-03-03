import { describe, expect, test, vi } from 'vitest';

const { dashboardMock } = vi.hoisted(() => ({
  dashboardMock: vi.fn(() => null)
}));

vi.mock('../app/_dashboard', () => ({
  default: dashboardMock
}));

import BoardPage from '../app/board/page';

describe('board page defaults', () => {
  test('applies Samwise assignee and active-state focus defaults', () => {
    BoardPage({ searchParams: {} });

    expect(dashboardMock).toHaveBeenCalledWith({
      searchParams: {
        taskAssigneeId: '2',
        taskState: 'next,scheduled'
      }
    });
  });

  test('preserves explicit task filters from URL', () => {
    BoardPage({ searchParams: { taskAssigneeId: '9', taskState: 'done' } });

    expect(dashboardMock).toHaveBeenCalledWith({
      searchParams: {
        taskAssigneeId: '9',
        taskState: 'done'
      }
    });
  });
});
