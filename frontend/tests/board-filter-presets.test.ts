import { describe, expect, test } from 'vitest';

import { boardFilterPresets, buildPresetHref } from '../lib/board-filter-presets';

describe('board filter presets', () => {
  test('builds stable board-first presets', () => {
    const presets = boardFilterPresets();
    expect(presets.map((p) => p.key)).toEqual(['my-active', 'due-24h', 'p1-work']);

    const myActive = presets.find((p) => p.key === 'my-active');
    expect(myActive?.query.taskAssigneeId).toBe('2');
    expect(myActive?.query.taskState).toBe('next,scheduled');
  });

  test('buildPresetHref keeps non-task query params while applying preset filters', () => {
    const current = new URLSearchParams({ principalPage: '2', taskQ: 'legacy', taskPage: '9' });
    const dueSoon = boardFilterPresets().find((preset) => preset.key === 'due-24h');
    expect(dueSoon).toBeTruthy();

    const href = buildPresetHref(current, dueSoon!);
    expect(href.startsWith('/board?')).toBe(true);
    const query = new URLSearchParams(href.replace('/board?', ''));

    expect(query.get('principalPage')).toBe('2');
    expect(query.get('taskDueWindow')).toBe('24');
    expect(query.get('taskState')).toBe('next,scheduled,waiting');
    expect(query.get('taskQ')).toBeNull();
    expect(query.get('taskPage')).toBeNull();
  });
});
