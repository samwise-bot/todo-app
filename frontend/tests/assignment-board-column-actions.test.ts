import { beforeEach, describe, expect, test, vi } from 'vitest';

const { revalidatePathMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn()
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock
}));

import { INITIAL_ACTION_STATE } from '../lib/action-state';
import {
  assignTaskAction,
  createBoardAction,
  createColumnAction,
  createTaskAction,
  deleteBoardAction,
  deleteColumnAction,
  setTaskBoardColumnAction,
  updateBoardAction,
  updateColumnAction
} from '../app/actions';

function okResponse() {
  return {
    ok: true,
    text: vi.fn().mockResolvedValue('')
  } as unknown as Response;
}

function extractRequest(call: unknown[]) {
  const [url, init] = call as [string, RequestInit];
  return { url, init };
}

describe('assignment + board/column action semantics', () => {
  beforeEach(() => {
    revalidatePathMock.mockReset();
    vi.restoreAllMocks();
  });

  test('assignTaskAction sends assignee payload and returns success state', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okResponse());
    const formData = new FormData();
    formData.set('taskId', '12');
    formData.set('assigneeId', '7');

    const result = await assignTaskAction(INITIAL_ACTION_STATE, formData);

    expect(result).toEqual({ status: 'success', message: 'Task assigned.', fieldErrors: {} });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { url, init } = extractRequest(fetchMock.mock.calls[0]);
    expect(url).toBe('http://localhost:8080/api/tasks/12/assignee');
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(JSON.stringify({ assigneeId: 7 }));
    expect(revalidatePathMock).toHaveBeenCalledWith('/');
  });

  test('assignTaskAction unassigns when assigneeId is blank', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okResponse());
    const formData = new FormData();
    formData.set('taskId', '12');
    formData.set('assigneeId', '');

    const result = await assignTaskAction(INITIAL_ACTION_STATE, formData);

    expect(result).toEqual({ status: 'success', message: 'Task unassigned.', fieldErrors: {} });
    const { init } = extractRequest(fetchMock.mock.calls[0]);
    expect(init.body).toBe(JSON.stringify({ assigneeId: null }));
    expect(revalidatePathMock).toHaveBeenCalledWith('/');
  });

  test('assignTaskAction returns validation state for bad ids and skips API call', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okResponse());
    const invalidTask = new FormData();
    invalidTask.set('taskId', 'abc');
    invalidTask.set('assigneeId', '2');

    const invalidTaskResult = await assignTaskAction(INITIAL_ACTION_STATE, invalidTask);
    expect(invalidTaskResult.fieldErrors).toEqual({ taskId: 'Task is invalid.' });

    const invalidAssignee = new FormData();
    invalidAssignee.set('taskId', '4');
    invalidAssignee.set('assigneeId', 'x');

    const invalidAssigneeResult = await assignTaskAction(INITIAL_ACTION_STATE, invalidAssignee);
    expect(invalidAssigneeResult.fieldErrors).toEqual({ assigneeId: 'Assignee is invalid.' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  test('setTaskBoardColumnAction sends board column payload and supports unassign', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okResponse());

    const moveData = new FormData();
    moveData.set('taskId', '18');
    moveData.set('boardColumnId', '4');
    const moveResult = await setTaskBoardColumnAction(INITIAL_ACTION_STATE, moveData);
    expect(moveResult).toEqual({ status: 'success', message: 'Task moved to board column.', fieldErrors: {} });
    let req = extractRequest(fetchMock.mock.calls[0]);
    expect(req.url).toBe('http://localhost:8080/api/tasks/18/board-column');
    expect(req.init.method).toBe('PATCH');
    expect(req.init.body).toBe(JSON.stringify({ boardColumnId: 4 }));

    const unassignData = new FormData();
    unassignData.set('taskId', '18');
    unassignData.set('boardColumnId', '');
    const unassignResult = await setTaskBoardColumnAction(INITIAL_ACTION_STATE, unassignData);
    expect(unassignResult).toEqual({ status: 'success', message: 'Task removed from board column.', fieldErrors: {} });
    req = extractRequest(fetchMock.mock.calls[1]);
    expect(req.init.body).toBe(JSON.stringify({ boardColumnId: null }));
  });

  test('setTaskBoardColumnAction validates IDs and skips API call on errors', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okResponse());

    const badTaskData = new FormData();
    badTaskData.set('taskId', 'bad');
    badTaskData.set('boardColumnId', '2');
    const badTaskResult = await setTaskBoardColumnAction(INITIAL_ACTION_STATE, badTaskData);
    expect(badTaskResult.fieldErrors).toEqual({ taskId: 'Task is invalid.' });

    const badColumnData = new FormData();
    badColumnData.set('taskId', '4');
    badColumnData.set('boardColumnId', 'nope');
    const badColumnResult = await setTaskBoardColumnAction(INITIAL_ACTION_STATE, badColumnData);
    expect(badColumnResult.fieldErrors).toEqual({ boardColumnId: 'Board column is invalid.' });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('createTaskAction includes boardColumnId and validates board column', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okResponse());

    const createData = new FormData();
    createData.set('title', 'Task with lane');
    createData.set('description', 'desc');
    createData.set('state', 'inbox');
    createData.set('projectId', '6');
    createData.set('boardColumnId', '9');
    const createResult = await createTaskAction(INITIAL_ACTION_STATE, createData);
    expect(createResult.status).toBe('success');
    const req = extractRequest(fetchMock.mock.calls[0]);
    expect(req.url).toBe('http://localhost:8080/api/tasks');
    expect(req.init.method).toBe('POST');
    expect(req.init.body).toBe(JSON.stringify({
      title: 'Task with lane',
      description: 'desc',
      state: 'inbox',
      projectId: 6,
      boardColumnId: 9
    }));

    const badCreateData = new FormData();
    badCreateData.set('title', 'Broken');
    badCreateData.set('description', '');
    badCreateData.set('state', 'inbox');
    badCreateData.set('boardColumnId', 'xyz');
    const badCreateResult = await createTaskAction(INITIAL_ACTION_STATE, badCreateData);
    expect(badCreateResult.fieldErrors).toEqual({ boardColumnId: 'Board column is invalid.' });
  });

  test('board actions handle success payloads and validation failures', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okResponse());

    const createData = new FormData();
    createData.set('name', 'Engineering');
    createData.set('projectId', '3');
    const createResult = await createBoardAction(INITIAL_ACTION_STATE, createData);
    expect(createResult.status).toBe('success');
    let req = extractRequest(fetchMock.mock.calls[0]);
    expect(req.url).toBe('http://localhost:8080/api/boards');
    expect(req.init.method).toBe('POST');
    expect(req.init.body).toBe(JSON.stringify({ name: 'Engineering', projectId: 3 }));

    const badCreateData = new FormData();
    badCreateData.set('name', '');
    badCreateData.set('projectId', '0');
    const badCreateResult = await createBoardAction(INITIAL_ACTION_STATE, badCreateData);
    expect(badCreateResult.fieldErrors).toEqual({
      name: 'Board name is required.',
      projectId: 'Project is required.'
    });

    const updateData = new FormData();
    updateData.set('boardId', '9');
    updateData.set('name', 'Updated');
    const updateResult = await updateBoardAction(INITIAL_ACTION_STATE, updateData);
    expect(updateResult.status).toBe('success');
    req = extractRequest(fetchMock.mock.calls[1]);
    expect(req.url).toBe('http://localhost:8080/api/boards/9');
    expect(req.init.method).toBe('PATCH');
    expect(req.init.body).toBe(JSON.stringify({ name: 'Updated' }));

    const badUpdateData = new FormData();
    badUpdateData.set('boardId', 'x');
    badUpdateData.set('name', '');
    const badUpdateResult = await updateBoardAction(INITIAL_ACTION_STATE, badUpdateData);
    expect(badUpdateResult.fieldErrors).toEqual({
      boardId: 'Board is invalid.',
      name: 'Board name is required.'
    });

    const deleteData = new FormData();
    deleteData.set('boardId', '2');
    const deleteResult = await deleteBoardAction(INITIAL_ACTION_STATE, deleteData);
    expect(deleteResult.status).toBe('success');
    req = extractRequest(fetchMock.mock.calls[2]);
    expect(req.url).toBe('http://localhost:8080/api/boards/2');
    expect(req.init.method).toBe('DELETE');
    expect(req.init.body).toBe(JSON.stringify({}));

    const badDeleteData = new FormData();
    badDeleteData.set('boardId', '');
    const badDeleteResult = await deleteBoardAction(INITIAL_ACTION_STATE, badDeleteData);
    expect(badDeleteResult.fieldErrors).toEqual({ boardId: 'Board is invalid.' });
  });

  test('column actions handle success payloads and validation failures', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(okResponse());

    const createData = new FormData();
    createData.set('name', 'Doing');
    createData.set('boardId', '11');
    createData.set('position', '4');
    const createResult = await createColumnAction(INITIAL_ACTION_STATE, createData);
    expect(createResult.status).toBe('success');
    let req = extractRequest(fetchMock.mock.calls[0]);
    expect(req.url).toBe('http://localhost:8080/api/columns');
    expect(req.init.method).toBe('POST');
    expect(req.init.body).toBe(JSON.stringify({ name: 'Doing', boardId: 11, position: 4 }));

    const defaultPositionData = new FormData();
    defaultPositionData.set('name', 'Backlog');
    defaultPositionData.set('boardId', '11');
    defaultPositionData.set('position', '');
    const defaultPositionResult = await createColumnAction(INITIAL_ACTION_STATE, defaultPositionData);
    expect(defaultPositionResult.status).toBe('success');
    req = extractRequest(fetchMock.mock.calls[1]);
    expect(req.init.body).toBe(JSON.stringify({ name: 'Backlog', boardId: 11, position: 0 }));

    const badCreateData = new FormData();
    badCreateData.set('name', '');
    badCreateData.set('boardId', 'x');
    badCreateData.set('position', '1.5');
    const badCreateResult = await createColumnAction(INITIAL_ACTION_STATE, badCreateData);
    expect(badCreateResult.fieldErrors).toEqual({
      name: 'Column name is required.',
      boardId: 'Board is invalid.',
      position: 'Position must be an integer.'
    });

    const updateData = new FormData();
    updateData.set('columnId', '7');
    updateData.set('name', 'Done');
    updateData.set('position', '6');
    const updateResult = await updateColumnAction(INITIAL_ACTION_STATE, updateData);
    expect(updateResult.status).toBe('success');
    req = extractRequest(fetchMock.mock.calls[2]);
    expect(req.url).toBe('http://localhost:8080/api/columns/7');
    expect(req.init.method).toBe('PATCH');
    expect(req.init.body).toBe(JSON.stringify({ name: 'Done', position: 6 }));

    const badUpdateData = new FormData();
    badUpdateData.set('columnId', '0');
    badUpdateData.set('name', '');
    badUpdateData.set('position', 'not-int');
    const badUpdateResult = await updateColumnAction(INITIAL_ACTION_STATE, badUpdateData);
    expect(badUpdateResult.fieldErrors).toEqual({
      columnId: 'Column is invalid.',
      name: 'Column name is required.',
      position: 'Position must be an integer.'
    });

    const deleteData = new FormData();
    deleteData.set('columnId', '5');
    const deleteResult = await deleteColumnAction(INITIAL_ACTION_STATE, deleteData);
    expect(deleteResult.status).toBe('success');
    req = extractRequest(fetchMock.mock.calls[3]);
    expect(req.url).toBe('http://localhost:8080/api/columns/5');
    expect(req.init.method).toBe('DELETE');
    expect(req.init.body).toBe(JSON.stringify({}));

    const badDeleteData = new FormData();
    badDeleteData.set('columnId', '');
    const badDeleteResult = await deleteColumnAction(INITIAL_ACTION_STATE, badDeleteData);
    expect(badDeleteResult.fieldErrors).toEqual({ columnId: 'Column is invalid.' });
  });
});
