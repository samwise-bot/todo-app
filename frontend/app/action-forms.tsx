'use client';

import type { ReactNode } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  assignTaskAction,
  createBoardAction,
  createColumnAction,
  createPrincipalAction,
  createTaskAction,
  deleteBoardAction,
  deleteColumnAction,
  setTaskBoardColumnAction,
  transitionTaskStateAction,
  updateBoardAction,
  updateColumnAction
} from './actions';
import { INITIAL_ACTION_STATE, type ActionState } from '../lib/action-state';
import { TASK_STATES } from '../lib/task-states';

type ProjectOption = {
  id: number;
  name: string;
};

type PrincipalOption = {
  id: number;
  displayName: string;
};

type TaskOption = {
  id: number;
  state: string;
  assigneeId?: number | null;
  boardColumnId?: number | null;
};

type BoardOption = {
  id: number;
  name: string;
};

type ColumnOption = {
  id: number;
  name: string;
  position: number;
};

type TaskColumnOption = {
  id: number;
  label: string;
};

function PendingFieldset({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <fieldset disabled={pending} style={{ border: 0, margin: 0, padding: 0, minInlineSize: 0 }}>
      {children}
    </fieldset>
  );
}

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit">{pending ? (pendingLabel ?? 'Saving...') : idleLabel}</button>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div style={{ color: '#b00020', fontSize: 13 }}>{message}</div>;
}

function FormFeedback({ state }: { state: ActionState }) {
  if (state.status === 'idle' || !state.message) return null;
  return (
    <p style={{ color: state.status === 'error' ? '#b00020' : '#0a7a34', margin: '8px 0 0' }} role={state.status === 'error' ? 'alert' : 'status'}>
      {state.message}
    </p>
  );
}

export function CreateTaskForm({ projects, taskColumns }: { projects: ProjectOption[]; taskColumns: TaskColumnOption[] }) {
  const [state, formAction] = useFormState(createTaskAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h2>Create task</h2>
      <PendingFieldset>
        <div style={{ display: 'grid', gap: 8 }}>
          <input name="title" placeholder="Task title" required aria-invalid={Boolean(state.fieldErrors.title)} />
          <FieldError message={state.fieldErrors.title} />
          <input name="description" placeholder="Description" />
          <select name="projectId" defaultValue="" aria-invalid={Boolean(state.fieldErrors.projectId)}>
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <FieldError message={state.fieldErrors.projectId} />
          <select name="boardColumnId" defaultValue="" aria-invalid={Boolean(state.fieldErrors.boardColumnId)}>
            <option value="">No board column</option>
            {taskColumns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <FieldError message={state.fieldErrors.boardColumnId} />
          <select name="state" defaultValue="inbox" aria-invalid={Boolean(state.fieldErrors.state)}>
            {TASK_STATES.map((taskState) => <option key={taskState} value={taskState}>{taskState}</option>)}
          </select>
          <FieldError message={state.fieldErrors.state} />
          <SubmitButton idleLabel="Create task" pendingLabel="Creating..." />
        </div>
      </PendingFieldset>
      <FormFeedback state={state} />
    </form>
  );
}

export function CreatePrincipalForm() {
  const [state, formAction] = useFormState(createPrincipalAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h2>Create principal</h2>
      <PendingFieldset>
        <div style={{ display: 'grid', gap: 8 }}>
          <select name="kind" defaultValue="human" aria-invalid={Boolean(state.fieldErrors.kind)}>
            <option value="human">human</option>
            <option value="agent">agent</option>
          </select>
          <FieldError message={state.fieldErrors.kind} />
          <input name="handle" placeholder="handle (alice, agent.ops)" required aria-invalid={Boolean(state.fieldErrors.handle)} />
          <FieldError message={state.fieldErrors.handle} />
          <input name="displayName" placeholder="Display name" required aria-invalid={Boolean(state.fieldErrors.displayName)} />
          <FieldError message={state.fieldErrors.displayName} />
          <SubmitButton idleLabel="Create principal" pendingLabel="Creating..." />
        </div>
      </PendingFieldset>
      <FormFeedback state={state} />
    </form>
  );
}

export function TransitionTaskStateForm({ task }: { task: TaskOption }) {
  const [state, formAction] = useFormState(transitionTaskStateAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: 'inline-flex', gap: 6, flexDirection: 'column' }}>
      <PendingFieldset>
        <input type="hidden" name="taskId" value={task.id} />
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <select name="state" defaultValue={task.state} aria-invalid={Boolean(state.fieldErrors.state)}>
            {TASK_STATES.map((taskState) => <option key={taskState} value={taskState}>{taskState}</option>)}
          </select>
          <SubmitButton idleLabel="Move" pendingLabel="Moving..." />
        </div>
      </PendingFieldset>
      <FieldError message={state.fieldErrors.state || state.fieldErrors.taskId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function AssignTaskForm({ task, principals }: { task: TaskOption; principals: PrincipalOption[] }) {
  const [state, formAction] = useFormState(assignTaskAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: 'inline-flex', gap: 6, flexDirection: 'column' }}>
      <PendingFieldset>
        <input type="hidden" name="taskId" value={task.id} />
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <select name="assigneeId" defaultValue={task.assigneeId ?? ''} aria-invalid={Boolean(state.fieldErrors.assigneeId)}>
            <option value="">Unassigned</option>
            {principals.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
          </select>
          <SubmitButton idleLabel={task.assigneeId ? 'Reassign' : 'Assign'} pendingLabel="Saving..." />
        </div>
      </PendingFieldset>
      <FieldError message={state.fieldErrors.assigneeId || state.fieldErrors.taskId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function SetTaskBoardColumnForm({ task, taskColumns }: { task: TaskOption; taskColumns: TaskColumnOption[] }) {
  const [state, formAction] = useFormState(setTaskBoardColumnAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: 'inline-flex', gap: 6, flexDirection: 'column' }}>
      <PendingFieldset>
        <input type="hidden" name="taskId" value={task.id} />
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <select name="boardColumnId" defaultValue={task.boardColumnId ?? ''} aria-invalid={Boolean(state.fieldErrors.boardColumnId)}>
            <option value="">No board column</option>
            {taskColumns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <SubmitButton idleLabel={task.boardColumnId ? 'Move column' : 'Set column'} pendingLabel="Saving..." />
        </div>
      </PendingFieldset>
      <FieldError message={state.fieldErrors.boardColumnId || state.fieldErrors.taskId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function CreateBoardForm({ projects }: { projects: ProjectOption[] }) {
  const [state, formAction] = useFormState(createBoardAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <h3>Create board</h3>
      <PendingFieldset>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 2fr auto' }}>
          <input name="name" placeholder="Board name" required aria-invalid={Boolean(state.fieldErrors.name)} />
          <select name="projectId" defaultValue="" aria-invalid={Boolean(state.fieldErrors.projectId)}>
            <option value="" disabled>Select project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <SubmitButton idleLabel="Create" pendingLabel="Creating..." />
        </div>
      </PendingFieldset>
      <FieldError message={state.fieldErrors.name || state.fieldErrors.projectId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function UpdateBoardForm({ board }: { board: BoardOption }) {
  const [state, formAction] = useFormState(updateBoardAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: 'inline-flex', gap: 6, marginRight: 8, flexDirection: 'column' }}>
      <PendingFieldset>
        <input type="hidden" name="boardId" value={board.id} />
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <input name="name" defaultValue={board.name} required aria-invalid={Boolean(state.fieldErrors.name)} />
          <SubmitButton idleLabel="Rename" pendingLabel="Renaming..." />
        </div>
      </PendingFieldset>
      <FieldError message={state.fieldErrors.name || state.fieldErrors.boardId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function DeleteBoardForm({ boardId }: { boardId: number }) {
  const [state, formAction] = useFormState(deleteBoardAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: 'inline-flex', flexDirection: 'column' }}>
      <PendingFieldset>
        <input type="hidden" name="boardId" value={boardId} />
        <SubmitButton idleLabel="Delete board" pendingLabel="Deleting..." />
      </PendingFieldset>
      <FieldError message={state.fieldErrors.boardId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function CreateColumnForm({ boardId }: { boardId: number }) {
  const [state, formAction] = useFormState(createColumnAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr auto', marginTop: 10 }}>
      <PendingFieldset>
        <input type="hidden" name="boardId" value={boardId} />
        <input name="name" placeholder="New column name" required aria-invalid={Boolean(state.fieldErrors.name)} />
        <input name="position" type="number" defaultValue={0} aria-invalid={Boolean(state.fieldErrors.position)} />
        <SubmitButton idleLabel="Add column" pendingLabel="Adding..." />
      </PendingFieldset>
      <FieldError message={state.fieldErrors.name || state.fieldErrors.position || state.fieldErrors.boardId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function UpdateColumnForm({ column }: { column: ColumnOption }) {
  const [state, formAction] = useFormState(updateColumnAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: 'inline-flex', gap: 6, marginRight: 8, flexDirection: 'column' }}>
      <PendingFieldset>
        <input type="hidden" name="columnId" value={column.id} />
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <input name="name" defaultValue={column.name} required aria-invalid={Boolean(state.fieldErrors.name)} />
          <input name="position" type="number" defaultValue={column.position} required aria-invalid={Boolean(state.fieldErrors.position)} />
          <SubmitButton idleLabel="Update column" pendingLabel="Updating..." />
        </div>
      </PendingFieldset>
      <FieldError message={state.fieldErrors.name || state.fieldErrors.position || state.fieldErrors.columnId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function DeleteColumnForm({ columnId }: { columnId: number }) {
  const [state, formAction] = useFormState(deleteColumnAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: 'inline-flex', flexDirection: 'column' }}>
      <PendingFieldset>
        <input type="hidden" name="columnId" value={columnId} />
        <SubmitButton idleLabel="Delete" pendingLabel="Deleting..." />
      </PendingFieldset>
      <FieldError message={state.fieldErrors.columnId} />
      <FormFeedback state={state} />
    </form>
  );
}
