import type { Context, Next } from 'hono'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000).unref()

function getClientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c.req.header('x-real-ip')
    || 'unknown'
}

/**
 * In-memory sliding-window rate limiter middleware for Hono.
 * Returns standard rate-limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After.
 *
 * @param maxAttempts - Maximum requests allowed within the window
 * @param windowMs - Window duration in milliseconds
 * @returns Hono middleware that returns 429 when the limit is exceeded
 */
export function rateLimit(maxAttempts: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const ip = getClientIp(c)
    const now = Date.now()
    const entry = store.get(ip)

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs })
      c.header('X-RateLimit-Limit', maxAttempts.toString())
      c.header('X-RateLimit-Remaining', (maxAttempts - 1).toString())
      await next()
      return
    }

    entry.count++

    if (entry.count > maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      c.header('Retry-After', retryAfter.toString())
      c.header('X-RateLimit-Limit', maxAttempts.toString())
      c.header('X-RateLimit-Remaining', '0')
      return c.json({ error: `请求过于频繁，请 ${retryAfter} 秒后重试` }, 429)
    }

    c.header('X-RateLimit-Limit', maxAttempts.toString())
    c.header('X-RateLimit-Remaining', (maxAttempts - entry.count).toString())
    await next()
  }
}

/** Resets the rate limit counter for a specific IP (e.g. after successful login). */
export function resetRateLimitForIp(ip: string): void {
  store.delete(ip)
}

/** Clears all rate limit state. For testing only. */
export function clearAllRateLimits(): void {
  store.clear()
}
