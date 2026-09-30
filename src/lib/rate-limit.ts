interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: "auth" },
  api_read: { windowMs: 60 * 1000, maxRequests: 100, keyPrefix: "api_read" },
  api_write: { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: "api_write" },
  admin: { windowMs: 60 * 1000, maxRequests: 200, keyPrefix: "admin" },
  upload: { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: "upload" },
};

function internalCheck(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function checkRateLimit(
  ip: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; headers: Record<string, string> } {
  const key = `${config.keyPrefix}:${ip}`;
  const { allowed, remaining, resetAt } = internalCheck(key, config.maxRequests, config.windowMs);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
  if (!allowed) {
    headers["Retry-After"] = String(Math.ceil((resetAt - Date.now()) / 1000));
  }
  return { allowed, remaining, headers };
}

export function getRateLimitHeaders(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000,
): Record<string, string> {
  const { allowed, remaining, resetAt } = internalCheck(key, maxRequests, windowMs);
  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
    ...(allowed ? {} : { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) }),
  };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
