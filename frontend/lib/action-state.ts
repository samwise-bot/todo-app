export type ActionStatus = 'idle' | 'success' | 'error';

export type ActionState = {
  status: ActionStatus;
  message: string | null;
  fieldErrors: Record<string, string>;
};

export const INITIAL_ACTION_STATE: ActionState = {
  status: 'idle',
  message: null,
  fieldErrors: {}
};

export function successActionState(message: string): ActionState {
  return {
    status: 'success',
    message,
    fieldErrors: {}
  };
}

export function validationErrorState(fieldErrors: Record<string, string>, message = 'Please correct the highlighted fields.'): ActionState {
  return {
    status: 'error',
    message,
    fieldErrors
  };
}

export function failureActionState(message: string): ActionState {
  return {
    status: 'error',
    message,
    fieldErrors: {}
  };
}

export function actionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Request failed. Please try again.';
}
