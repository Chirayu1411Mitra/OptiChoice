import type { Request, RequestHandler } from "express";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  code: string;
  message: string;
  key?: (request: Request) => string;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

function clientIp(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

/**
 * A small per-process rate limiter for the single-instance local/development API.
 * Multi-instance deployments should replace this store with a shared Redis store.
 */
export function rateLimit(options: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, RateLimitBucket>();
  let requestsSinceCleanup = 0;

  return (request, response, next) => {
    const now = Date.now();
    const key = (options.key ?? clientIp)(request);
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, options.limit - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    response.setHeader("RateLimit-Limit", options.limit);
    response.setHeader("RateLimit-Remaining", remaining);
    response.setHeader("RateLimit-Reset", resetSeconds);

    if (bucket.count > options.limit) {
      response.setHeader("Retry-After", resetSeconds);
      response.status(429).json({ error: { code: options.code, message: options.message } });
      return;
    }

    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= 256) {
      requestsSinceCleanup = 0;
      for (const [bucketKey, current] of buckets) {
        if (current.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    next();
  };
}

export const authRateLimit = rateLimit({
  limit: 20,
  windowMs: 15 * 60 * 1000,
  code: "AUTH_RATE_LIMITED",
  message: "Too many account requests. Wait a few minutes and try again.",
});

export const aiExplanationRateLimit = rateLimit({
  limit: 5,
  windowMs: 60 * 1000,
  code: "AI_RATE_LIMITED",
  message: "Too many AI explanations were requested. Wait a minute and try again.",
  key: (request) => request.authUser?.id ?? clientIp(request),
});

export const productSearchRateLimit = rateLimit({
  limit: 20,
  windowMs: 60 * 1000,
  code: "PRODUCT_SEARCH_RATE_LIMITED",
  message: "Too many product searches were requested. Wait a minute and try again.",
});
