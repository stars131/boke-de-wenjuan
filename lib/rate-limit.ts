type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  options: {
    limit: number;
    windowMs: number;
  }
) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs
    });

    return {
      ok: true,
      remaining: options.limit - 1,
      resetAt: now + options.windowMs
    };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt
  };
}
