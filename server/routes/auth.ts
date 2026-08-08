import { Hono } from 'hono'
import { readJSON, writeJSON } from '../storage.js'
import { createHash, randomUUID } from 'crypto'
import { rateLimit, resetRateLimitForIp } from '../middleware/rateLimit.js'

/** Shape of the persisted auth state */
interface AuthData {
  /** SHA-256 hash of the admin password + salt */
  passwordHash: string
  /** Map of active session tokens to their expiry timestamps (ms) */
  sessions: Record<string, number>
}

const FILE = 'auth.json'
const SALT = 'blog-salt-2024'

/**
 * Hashes a password with SHA-256 using a fixed application salt.
 * Not suitable for multi-user systems — intended only for single-admin blog auth.
 */
function hash(pw: string): string { return createHash('sha256').update(pw + SALT).digest('hex') }

const DEFAULT_AUTH: AuthData = { passwordHash: hash('admin123'), sessions: {} }

const auth = new Hono()

// Rate limit: 5 login attempts per minute per IP
auth.use('/login', rateLimit(5, 60_000))

/**
 * POST /api/auth/login
 *
 * Authenticates the admin user and creates a 24-hour session.
 *
 * @requestBody `{ password: string }`
 * @returns `{ token: string, expiry: number }` — 200 on success
 * @returns `{ error: string }` — 401 on wrong password
 *
 * @example
 * ```
 * POST /api/auth/login
 * { "password": "admin123" }
 * → { "token": "550e8400-...", "expiry": 1735689600000 }
 * ```
 */
auth.post('/login', async (c) => {
  const { password } = await c.req.json<{ password: string }>()
  if (!password) return c.json({ error: '密码不能为空' }, 400)
  const data = readJSON<AuthData>(FILE, DEFAULT_AUTH)
  if (hash(password) !== data.passwordHash) return c.json({ error: '密码错误' }, 401)
  const token = randomUUID()
  const expiry = Date.now() + 24 * 60 * 60 * 1000
  data.sessions[token] = expiry
  // Clean expired sessions
  for (const [k, v] of Object.entries(data.sessions)) { if (Date.now() > v) delete data.sessions[k] }
  writeJSON(FILE, data)
    resetRateLimitForIp(c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown')
    return c.json({ token, expiry })
})

/**
 * POST /api/auth/verify
 *
 * Checks whether a session token is still valid.
 *
 * @requestBody `{ token: string }`
 * @returns `{ valid: true }` — 200
 * @returns `{ valid: false }` — 401 if expired or unknown
 */
auth.post('/verify', async (c) => {
  const { token } = await c.req.json<{ token: string }>()
  const data = readJSON<AuthData>(FILE, DEFAULT_AUTH)
  const expiry = data.sessions[token]
  if (!expiry || Date.now() > expiry) return c.json({ valid: false }, 401)
  return c.json({ valid: true })
})

/**
 * POST /api/auth/logout
 *
 * Revokes a session token.
 *
 * @requestBody `{ token: string }`
 * @returns `{ ok: true }` — 200
 */
auth.post('/logout', async (c) => {
  const { token } = await c.req.json<{ token: string }>()
  const data = readJSON<AuthData>(FILE, DEFAULT_AUTH)
  delete data.sessions[token]
  writeJSON(FILE, data)
  return c.json({ ok: true })
})

/**
 * POST /api/auth/change-password
 *
 * Changes the admin password. Requires the current password for verification.
 *
 * @requestBody `{ oldPassword: string, newPassword: string }`
 * @returns `{ ok: true }` — 200
 * @returns `{ error: string }` — 400 if old password is wrong or new password < 6 chars
 */
auth.post('/change-password', async (c) => {
  const { oldPassword, newPassword } = await c.req.json<{ oldPassword: string; newPassword: string }>()
  if (!newPassword || newPassword.length < 6) return c.json({ error: '新密码至少6位' }, 400)
  const data = readJSON<AuthData>(FILE, DEFAULT_AUTH)
  if (hash(oldPassword) !== data.passwordHash) return c.json({ error: '原密码错误' }, 400)
  data.passwordHash = hash(newPassword)
  writeJSON(FILE, data)
  return c.json({ ok: true })
})

export default auth
