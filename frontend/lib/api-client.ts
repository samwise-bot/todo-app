export type ListFetchResult<T> = {
  items: T[];
  error: string | null;
};

export type PagedListFetchResult<T> = ListFetchResult<T> & {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type MaybePaged<T> =
  | T[]
  | {
      items?: T[];
      page?: number;
      pageSize?: number;
      totalItems?: number;
      totalPages?: number;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readItems<T>(data: unknown): T[] | null {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (isRecord(data) && Array.isArray(data.items)) {
    return data.items as T[];
  }
  if (isRecord(data)) {
    const envelopeItems = [data.data, data.results];
    for (const envelope of envelopeItems) {
      if (Array.isArray(envelope)) {
        return envelope as T[];
      }
      if (isRecord(envelope) && Array.isArray(envelope.items)) {
        return envelope.items as T[];
      }
    }
  }
  return null;
}

function readNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function fetchCollection<T>(path: string, label: string): Promise<ListFetchResult<T>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}${path}`, { cache: 'no-store' });
    if (!res.ok) {
      return { items: [], error: `${label} data is unavailable (HTTP ${res.status}).` };
    }

    const data: MaybePaged<T> = await res.json();
    const items = readItems<T>(data);
    if (!items) {
      return { items: [], error: `${label} data is malformed.` };
    }
    return { items, error: null };
  } catch {
    return { items: [], error: `${label} data request failed.` };
  }
}

export async function fetchPagedCollection<T>(path: string, label: string): Promise<PagedListFetchResult<T>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}${path}`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        error: `${label} data is unavailable (HTTP ${res.status}).`
      };
    }

    const data: MaybePaged<T> = await res.json();
    const items = readItems<T>(data);
    if (!items) {
      return {
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        error: `${label} data is malformed.`
      };
    }

    if (Array.isArray(data)) {
      const total = items.length;
      return {
        items,
        page: 1,
        pageSize: Math.max(total, 1),
        totalItems: total,
        totalPages: total > 0 ? 1 : 0,
        error: null
      };
    }

    return {
      items,
      page: readNumber(data.page, 1),
      pageSize: Math.max(readNumber(data.pageSize, items.length || 20), 1),
      totalItems: readNumber(data.totalItems, items.length),
      totalPages: readNumber(data.totalPages, items.length > 0 ? 1 : 0),
      error: null
    };
  } catch {
    return {
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      error: `${label} data request failed.`
    };
  }
}
