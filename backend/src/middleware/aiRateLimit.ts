import type { RequestHandler } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const limit = 5;
const windowMs = 60_000;

/** Per-process limit for local development; production multi-instance apps should use shared storage. */
export const aiExplanationRateLimit: RequestHandler = (request, response, next) => {
  const userId = request.authUser?.id;
  const key = userId ?? request.ip ?? request.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);
  response.setHeader("RateLimit-Limit", limit);
  response.setHeader("RateLimit-Remaining", remaining);
  response.setHeader("RateLimit-Reset", resetSeconds);

  if (bucket.count > limit) {
    response.setHeader("Retry-After", resetSeconds);
    response.status(429).json({ error: { code: "AI_RATE_LIMITED", message: "Too many AI explanations were requested. Wait a minute and try again." } });
    return;
  }
  next();
};
