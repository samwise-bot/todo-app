import DashboardPage from '../_dashboard';
import type { SearchParamsInput } from '../../lib/list-query';

const SAMWISE_PRINCIPAL_ID = '2';
const FOCUS_STATES = 'next,scheduled';

export default function BoardPage({ searchParams }: { searchParams?: SearchParamsInput }) {
  const params = { ...(searchParams ?? {}) } as Record<string, string | string[] | undefined>;

  if (!params.taskAssigneeId) {
    params.taskAssigneeId = SAMWISE_PRINCIPAL_ID;
  }

  if (!params.taskState) {
    params.taskState = FOCUS_STATES;
  }

  return DashboardPage({ searchParams: params });
}
