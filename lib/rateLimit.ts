import { headers } from "next/headers";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window store
const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_STORE_SIZE = 10000;

/**
 * Extracts client IP address from Next.js request headers.
 */
export function getClientIp(): string {
  try {
    const headersList = headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      const clientIp = forwardedFor.split(",")[0]?.trim();
      if (clientIp) return clientIp;
    }
    const realIp = headersList.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
    const cfConnectingIp = headersList.get("cf-connecting-ip");
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
  } catch {
    // Graceful fallback if called outside active HTTP request context (e.g., build/tests)
  }
  return "127.0.0.1";
}

/**
 * Prunes expired timestamps across the store to prevent memory leaks.
 */
function cleanupExpiredRecords(windowMs: number) {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, { timestamps: validTimestamps });
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  error?: string;
  remaining: number;
  resetTime: number;
}

/**
 * In-memory sliding window rate limiter.
 *
 * @param key Unique identifier (e.g., prefix + IP)
 * @param limit Maximum allowed requests within the time window (default: 5)
 * @param windowMs Time window in milliseconds (default: 15 minutes = 900,000 ms)
 */
export function rateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();

  // Prune expired entries if store exceeds capacity threshold
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    cleanupExpiredRecords(windowMs);
  }

  const record = rateLimitStore.get(key);
  const validTimestamps = record
    ? record.timestamps.filter((ts) => now - ts < windowMs)
    : [];

  if (validTimestamps.length >= limit) {
    const oldestTimestamp = validTimestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    return {
      success: false,
      error: "تم تجاوز الحد المسموح به من المحاولات. يرجى المحاولة بعد 15 دقيقة.",
      remaining: 0,
      resetTime,
    };
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: validTimestamps });

  const oldestTimestamp = validTimestamps[0];
  const resetTime = oldestTimestamp + windowMs;
  const remaining = Math.max(0, limit - validTimestamps.length);

  return {
    success: true,
    remaining,
    resetTime,
  };
}

/**
 * Helper to check rate limit for the current client's IP.
 */
export function checkRateLimit(
  prefix: string = "parent_lookup",
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  const ip = getClientIp();
  const key = `${prefix}:${ip}`;
  return rateLimit(key, limit, windowMs);
}
