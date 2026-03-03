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

function SubmitButton({ idleLabel, pendingLabel, tone = 'primary' }: { idleLabel: string; pendingLabel?: string; tone?: 'primary' | 'secondary' | 'danger' }) {
  const { pending } = useFormStatus();
  const className = tone === 'danger' ? 'btn-danger' : tone === 'secondary' ? 'btn-secondary' : '';
  return (
    <button className={className} type="submit">
      {pending ? (pendingLabel ?? 'Saving...') : idleLabel}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="form-feedback-error">{message}</div>;
}

function FormFeedback({ state }: { state: ActionState }) {
  if (state.status === 'idle' || !state.message) return null;
  return <p className={state.status === 'error' ? 'form-feedback-error' : 'form-feedback-success'} role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>;
}

export function CreateTaskForm({ projects, taskColumns }: { projects: ProjectOption[]; taskColumns: TaskColumnOption[] }) {
  const [state, formAction] = useFormState(createTaskAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="form-card">
      <h2>Create task</h2>
      <PendingFieldset>
        <div className="form-stack">
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
          <select name="priority" defaultValue="3" aria-invalid={Boolean(state.fieldErrors.priority)}>
            <option value="1">Priority 1 (highest)</option>
            <option value="2">Priority 2</option>
            <option value="3">Priority 3</option>
            <option value="4">Priority 4</option>
            <option value="5">Priority 5 (lowest)</option>
          </select>
          <FieldError message={state.fieldErrors.priority} />
          <input name="dueAt" type="datetime-local" aria-invalid={Boolean(state.fieldErrors.dueAt)} />
          <FieldError message={state.fieldErrors.dueAt} />
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
    <form action={formAction} className="form-card">
      <h2>Create principal</h2>
      <PendingFieldset>
        <div className="form-stack">
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
    <form action={formAction}>
      <PendingFieldset>
        <input type="hidden" name="taskId" value={task.id} />
        <div className="form-row">
          <select name="state" defaultValue={task.state} aria-invalid={Boolean(state.fieldErrors.state)}>
            {TASK_STATES.map((taskState) => <option key={taskState} value={taskState}>{taskState}</option>)}
          </select>
          <SubmitButton idleLabel="Move" pendingLabel="Moving..." tone="secondary" />
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
    <form action={formAction}>
      <PendingFieldset>
        <input type="hidden" name="taskId" value={task.id} />
        <div className="form-row">
          <select name="assigneeId" defaultValue={task.assigneeId ?? ''} aria-invalid={Boolean(state.fieldErrors.assigneeId)}>
            <option value="">Unassigned</option>
            {principals.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
          </select>
          <SubmitButton idleLabel={task.assigneeId ? 'Reassign' : 'Assign'} pendingLabel="Saving..." tone="secondary" />
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
    <form action={formAction}>
      <PendingFieldset>
        <input type="hidden" name="taskId" value={task.id} />
        <div className="form-row">
          <select name="boardColumnId" defaultValue={task.boardColumnId ?? ''} aria-invalid={Boolean(state.fieldErrors.boardColumnId)}>
            <option value="">No board column</option>
            {taskColumns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <SubmitButton idleLabel={task.boardColumnId ? 'Move column' : 'Set column'} pendingLabel="Saving..." tone="secondary" />
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
    <form action={formAction} className="form-card">
      <h3>Create board</h3>
      <PendingFieldset>
        <div className="form-row">
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
    <form action={formAction}>
      <PendingFieldset>
        <input type="hidden" name="boardId" value={board.id} />
        <div className="form-row">
          <input name="name" defaultValue={board.name} required aria-invalid={Boolean(state.fieldErrors.name)} />
          <SubmitButton idleLabel="Rename" pendingLabel="Renaming..." tone="secondary" />
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
    <form action={formAction}>
      <PendingFieldset>
        <input type="hidden" name="boardId" value={boardId} />
        <SubmitButton idleLabel="Delete board" pendingLabel="Deleting..." tone="danger" />
      </PendingFieldset>
      <FieldError message={state.fieldErrors.boardId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function CreateColumnForm({ boardId }: { boardId: number }) {
  const [state, formAction] = useFormState(createColumnAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction}>
      <PendingFieldset>
        <input type="hidden" name="boardId" value={boardId} />
        <div className="form-row">
          <input name="name" placeholder="New column name" required aria-invalid={Boolean(state.fieldErrors.name)} />
          <input name="position" type="number" defaultValue={0} aria-invalid={Boolean(state.fieldErrors.position)} />
          <SubmitButton idleLabel="Add column" pendingLabel="Adding..." />
        </div>
      </PendingFieldset>
      <FieldError message={state.fieldErrors.name || state.fieldErrors.position || state.fieldErrors.boardId} />
      <FormFeedback state={state} />
    </form>
  );
}

export function UpdateColumnForm({ column }: { column: ColumnOption }) {
  const [state, formAction] = useFormState(updateColumnAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction}>
      <PendingFieldset>
        <input type="hidden" name="columnId" value={column.id} />
        <div className="form-row">
          <input name="name" defaultValue={column.name} required aria-invalid={Boolean(state.fieldErrors.name)} />
          <input name="position" type="number" defaultValue={column.position} required aria-invalid={Boolean(state.fieldErrors.position)} />
          <SubmitButton idleLabel="Update" pendingLabel="Updating..." tone="secondary" />
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
    <form action={formAction}>
      <PendingFieldset>
        <input type="hidden" name="columnId" value={columnId} />
        <SubmitButton idleLabel="Delete" pendingLabel="Deleting..." tone="danger" />
      </PendingFieldset>
      <FieldError message={state.fieldErrors.columnId} />
      <FormFeedback state={state} />
    </form>
  );
}
