import { randomBytes } from 'crypto'
import type { Context, Next } from 'hono'

const tokens = new Map<string, { token: string; expires: number }>()

// Clean expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of tokens) {
    if (now > entry.expires) tokens.delete(key)
  }
}, 10 * 60 * 1000).unref()

/** Generate a CSRF token for the given session and store it server-side. */
export function generateCsrfToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex')
  tokens.set(sessionId, { token, expires: Date.now() + 3600000 })
  return token
}

/** Validate that the supplied token matches the stored token for this session. */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = tokens.get(sessionId)
  if (!stored || Date.now() > stored.expires) return false
  return stored.token === token
}

/** Clear all stored CSRF tokens. For testing only. */
export function clearAllCsrfTokens(): void {
  tokens.clear()
}

/**
 * Hono middleware that enforces CSRF validation on state-changing
 * requests (POST / PUT / DELETE / PATCH).
 *
 * Reads the session from the `Authorization: Bearer <token>` header
 * and the CSRF token from the `X-CSRF-Token` header.
 */
export async function csrfMiddleware(c: Context, next: Next) {
  const method = c.req.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    await next()
    return
  }

  const authHeader = c.req.header('authorization')
  const sessionId = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined

  if (!sessionId) {
    return c.json({ error: '缺少认证信息' }, 401)
  }

  const csrfToken = c.req.header('x-csrf-token')
  if (!csrfToken || !validateCsrfToken(sessionId, csrfToken)) {
    return c.json({ error: '无效的 CSRF token' }, 403)
  }

  await next()
}
