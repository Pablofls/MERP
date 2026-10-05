// In-memory sliding-window rate limiter.
// Sufficient for a single-instance personal app; replace with Redis for multi-instance.
const windows = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return false;
  hits.push(now);
  windows.set(key, hits);
  return true;
}
