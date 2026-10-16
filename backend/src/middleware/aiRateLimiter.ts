import type { Request, Response, NextFunction } from "express";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const requestsByUser = new Map<string, RateLimitEntry>();

// Periodically remove expired entries so the map doesn't grow forever.
const cleanupTimer = setInterval(() => {
  const now = Date.now();

  for (const [userId, entry] of requestsByUser) {
    if (entry.resetAt <= now) {
      requestsByUser.delete(userId);
    }
  }
}, WINDOW_MS);

cleanupTimer.unref();

export function aiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const userId = req.authUser?.keycloakId;

  // Authentication middleware should run before this limiter.
  if (!userId) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const now = Date.now();
  let entry = requestsByUser.get(userId);

  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + WINDOW_MS,
    };

    requestsByUser.set(userId, entry);
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.resetAt - now) / 1000),
    );

    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.setHeader("X-RateLimit-Limit", String(MAX_REQUESTS));
    res.setHeader("X-RateLimit-Remaining", "0");

    return res.status(429).json({
      error: "Too many AI requests",
      limit: MAX_REQUESTS,
      retryAfterSeconds,
    });
  }

  entry.count += 1;

  res.setHeader("X-RateLimit-Limit", String(MAX_REQUESTS));
  res.setHeader("X-RateLimit-Remaining", String(MAX_REQUESTS - entry.count));

  return next();
}
