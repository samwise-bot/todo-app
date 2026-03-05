import { updateSearchParams } from './list-query';

export type BoardFilterPreset = {
  key: string;
  label: string;
  query: Record<string, string | null>;
};

const BASE_TASK_FILTER_RESET: Record<string, null> = {
  taskState: null,
  taskQ: null,
  taskProjectId: null,
  taskAssigneeId: null,
  taskBoardColumnId: null,
  taskPriority: null,
  taskDueWindow: null,
  taskPage: null
};

export function boardFilterPresets(defaultAssigneeId = '2'): BoardFilterPreset[] {
  return [
    {
      key: 'my-active',
      label: 'My active',
      query: {
        ...BASE_TASK_FILTER_RESET,
        taskAssigneeId: defaultAssigneeId,
        taskState: 'next,scheduled'
      }
    },
    {
      key: 'due-24h',
      label: 'Due in 24h',
      query: {
        ...BASE_TASK_FILTER_RESET,
        taskDueWindow: '24',
        taskState: 'next,scheduled,waiting'
      }
    },
    {
      key: 'p1-work',
      label: 'P1 focus',
      query: {
        ...BASE_TASK_FILTER_RESET,
        taskPriority: '1',
        taskState: 'next,scheduled,waiting'
      }
    }
  ];
}

export function buildPresetHref(currentParams: URLSearchParams, preset: BoardFilterPreset): string {
  const query = updateSearchParams(currentParams, preset.query).toString();
  return query ? `/?${query}` : '/';
}
