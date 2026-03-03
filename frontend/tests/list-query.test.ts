import { describe, expect, test } from 'vitest';

import {
  hiddenParamEntries,
  readPositiveIntParam,
  readStringParam,
  toURLSearchParams,
  updateSearchParams
} from '../lib/list-query';

describe('list query helpers', () => {
  test('toURLSearchParams normalizes record and keeps first array element', () => {
    const params = toURLSearchParams({
      taskState: 'next',
      principalKind: ['human', 'agent'],
      ignored: undefined
    });

    expect(params.get('taskState')).toBe('next');
    expect(params.get('principalKind')).toBe('human');
    expect(params.get('ignored')).toBeNull();
  });

  test('readPositiveIntParam falls back for invalid values', () => {
    const params = new URLSearchParams('page=3&pageSize=abc&bad=-1');

    expect(readPositiveIntParam(params, 'page', 1)).toBe(3);
    expect(readPositiveIntParam(params, 'pageSize', 20)).toBe(20);
    expect(readPositiveIntParam(params, 'bad', 20)).toBe(20);
  });

  test('updateSearchParams sets and removes keys', () => {
    const base = new URLSearchParams('taskState=next&taskPage=2');
    const next = updateSearchParams(base, {
      taskPage: 1,
      taskState: null,
      principalPageSize: 50
    });

    expect(next.get('taskPage')).toBe('1');
    expect(next.get('taskState')).toBeNull();
    expect(next.get('principalPageSize')).toBe('50');
  });

  test('hiddenParamEntries excludes listed keys', () => {
    const params = new URLSearchParams('a=1&b=2&c=3');
    expect(hiddenParamEntries(params, ['b'])).toEqual([
      ['a', '1'],
      ['c', '3']
    ]);
  });

  test('readStringParam returns fallback for missing key', () => {
    const params = new URLSearchParams('q=hello');
    expect(readStringParam(params, 'q', '')).toBe('hello');
    expect(readStringParam(params, 'missing', 'fallback')).toBe('fallback');
  });
});
