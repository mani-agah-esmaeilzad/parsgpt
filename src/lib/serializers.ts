export function parseStringArray(value?: string | null) {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed.filter((item) => typeof item === "string") as string[]) : [];
  } catch {
    return [];
  }
}

export function stringifyStringArray(values: string[]) {
  return JSON.stringify(values);
}

export function parseJson<T = unknown>(value?: string | null, fallback: T | null = null): T | null {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? null);
}
