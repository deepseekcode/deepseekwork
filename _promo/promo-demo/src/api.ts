export type RetryOptions = {
  retries: number;
  baseDelayMs: number;
  shouldRetry?: (status: number) => boolean;
};

const DEFAULTS: RetryOptions = {
  retries: 3,
  baseDelayMs: 250,
  shouldRetry: (status) => status >= 500 || status === 429,
};

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const opts = { ...DEFAULTS, ...(init as RetryOptions | undefined) };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return (await res.json()) as T;
      if (!opts.shouldRetry?.(res.status)) throw new Error(`HTTP ${res.status}`);
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await sleep(opts.baseDelayMs * 2 ** attempt);
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
