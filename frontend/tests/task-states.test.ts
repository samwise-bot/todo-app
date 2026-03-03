import { describe, expect, test } from 'vitest';
import { TASK_STATES } from '../lib/task-states';

describe('TASK_STATES', () => {
  test('includes canonical GTD states in order', () => {
    expect(TASK_STATES).toEqual(['inbox', 'next', 'waiting', 'scheduled', 'someday', 'reference', 'done']);
  });
});
