// Single-process fixed windows. Expired addresses are discarded; no IPs are persisted.
export function createRateLimiter(limit = 30, windowMs = 60_000) {
  const windows = new Map<string, { count: number; expires: number }>();
  return (key: string, now = Date.now()) => {
    for (const [id, value] of windows)
      if (value.expires <= now) windows.delete(id);
    const current = windows.get(key);
    if (current) {
      if (current.count >= limit)
        return Math.max(1, Math.ceil((current.expires - now) / 1000));
      current.count++;
    } else {
      if (windows.size >= 10_000) return Math.ceil(windowMs / 1000);
      windows.set(key, { count: 1, expires: now + windowMs });
    }
    return 0;
  };
}
