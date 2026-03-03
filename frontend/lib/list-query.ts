export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined;

export function toURLSearchParams(input: SearchParamsInput): URLSearchParams {
  if (!input) {
    return new URLSearchParams();
  }
  if (input instanceof URLSearchParams) {
    return new URLSearchParams(input);
  }
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      if (value.length > 0 && value[0] !== undefined) {
        out.set(key, value[0]);
      }
      continue;
    }
    if (value !== undefined) {
      out.set(key, value);
    }
  }
  return out;
}

export function readStringParam(params: URLSearchParams, key: string, fallback = ''): string {
  const value = params.get(key);
  if (value === null) {
    return fallback;
  }
  return value;
}

export function readPositiveIntParam(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key);
  if (raw === null || raw.trim() === '') {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function updateSearchParams(
  base: URLSearchParams,
  updates: Record<string, string | number | null | undefined>
): URLSearchParams {
  const out = new URLSearchParams(base);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || String(value).trim() === '') {
      out.delete(key);
      continue;
    }
    out.set(key, String(value));
  }
  return out;
}

export function hiddenParamEntries(params: URLSearchParams, excludedKeys: string[]): Array<[string, string]> {
  const excluded = new Set(excludedKeys);
  const entries: Array<[string, string]> = [];
  for (const [key, value] of params.entries()) {
    if (!excluded.has(key)) {
      entries.push([key, value]);
    }
  }
  return entries;
}
