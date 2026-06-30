export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function pickFirstString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const direct = asString(source[key]);
    if (direct) {
      return direct;
    }
  }

  return undefined;
}

export function pickFirstNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const direct = asNumber(source[key]);
    if (direct !== undefined) {
      return direct;
    }
  }

  return undefined;
}

export function collectUrls(value: unknown): string[] {
  const urls = new Set<string>();
  const seen = new Set<unknown>();

  function walk(current: unknown): void {
    if (typeof current === "string") {
      if (/^https?:\/\//i.test(current)) {
        urls.add(current);
      }
      return;
    }

    if (!isRecord(current) && !Array.isArray(current)) {
      return;
    }

    if (seen.has(current)) {
      return;
    }
    seen.add(current);

    if (Array.isArray(current)) {
      for (const item of current) {
        walk(item);
      }
      return;
    }

    for (const item of Object.values(current)) {
      walk(item);
    }
  }

  walk(value);
  return [...urls];
}
