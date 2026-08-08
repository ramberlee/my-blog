import { Hono } from 'hono'
import { readJSON, writeJSON } from '../storage.js'
import { randomUUID } from 'crypto'
import { hash, compare, genSalt } from 'bcryptjs'
import { createHash } from 'crypto'
import { rateLimit, resetRateLimitForIp } from '../middleware/rateLimit.js'

/** Shape of the persisted auth state */
interface AuthData {
  /** bcrypt hash of the admin password */
  passwordHash: string
  /** Map of active session tokens to their expiry timestamps (ms) */
  sessions: Record<string, number>
  /** Login attempt counter for brute force protection */
  loginAttempts: number
  /** Timestamp when account was locked (0 = not locked) */
  lockedUntil: number
}

const FILE = 'auth.json'
const BCRYPT_ROUNDS = 12
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

/** Legacy SHA-256 salt (used before bcrypt migration) */
const LEGACY_SALT = 'blog-salt-2024'

/** Detects whether a stored hash is bcrypt format ($2a$/$2b$/$2y$) */
function isBcryptHash(stored: string): boolean {
  return /^\$2[aby]\$/.test(stored)
}

/** Verifies a password against either bcrypt or legacy SHA-256 hash */
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false
  if (isBcryptHash(stored)) {
    return compare(password, stored)
  }
  // Legacy SHA-256 fallback for smooth migration
  return createHash('sha256').update(password + LEGACY_SALT).digest('hex') === stored
}

/**
 * Initialize default auth data with bcrypt-hashed password
 */
async function getDefaultAuth(): Promise<AuthData> {
  const salt = await genSalt(BCRYPT_ROUNDS)
  return {
    passwordHash: await hash('admin123', salt),
    sessions: {},
    loginAttempts: 0,
    lockedUntil: 0,
  }
}


async function getAuthData(): Promise<AuthData> {
  const data = readJSON<AuthData>(FILE, await getDefaultAuth())
  if (!data.passwordHash) {
    const defaultAuth = await getDefaultAuth()
    writeJSON(FILE, defaultAuth)
    return defaultAuth
  }
  return data
}

const auth = new Hono()

// Rate limit: 5 login attempts per minute per IP
auth.use('/login', rateLimit(5, 60_000))

/**
 * POST /api/auth/login
 *
 * Authenticates the admin user with bcrypt verification and brute force protection.
 * Account locks after 5 failed attempts for 15 minutes.
 *
 * @requestBody { password: string }
 * @returns { token: string, expiry: number } — 200 on success
 * @returns { error: string } — 401 on wrong password, 423 on account locked
 */
auth.post('/login', async (c) => {
  const { password } = await c.req.json<{ password: string }>()
  if (!password) return c.json({ error: '密码不能为空' }, 400)

  const data = await getAuthData()

  // Check if account is locked
  if (data.lockedUntil > 0 && Date.now() < data.lockedUntil) {
    const remaining = Math.ceil((data.lockedUntil - Date.now()) / 1000 / 60)
    return c.json({ error: `账户已锁定，请 ${remaining} 分钟后重试` }, 423)
  }

  // Reset lock if lockout period has passed
  if (data.lockedUntil > 0 && Date.now() >= data.lockedUntil) {
    data.loginAttempts = 0
    data.lockedUntil = 0
  }

  // Verify password (bcrypt, with legacy SHA-256 fallback)
  const isValid = await verifyPassword(password, data.passwordHash)

  if (!isValid) {
    data.loginAttempts++
    
    // Lock account after max attempts
    if (data.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      data.lockedUntil = Date.now() + LOCKOUT_DURATION
      writeJSON(FILE, data)
      return c.json({ error: '登录失败次数过多，账户已锁定15分钟' }, 423)
    }
    
    writeJSON(FILE, data)
    return c.json({ 
      error: '密码错误',
      remainingAttempts: MAX_LOGIN_ATTEMPTS - data.loginAttempts 
    }, 401)
  }

  // Successful login - reset attempts and create session
  data.loginAttempts = 0
  data.lockedUntil = 0

  // Upgrade legacy SHA-256 hash to bcrypt on successful login
  if (!isBcryptHash(data.passwordHash)) {
    const salt = await genSalt(BCRYPT_ROUNDS)
    data.passwordHash = await hash(password, salt)
  }

  const token = randomUUID()
  const expiry = Date.now() + 24 * 60 * 60 * 1000
  data.sessions[token] = expiry
  
  // Clean expired sessions
  for (const [k, v] of Object.entries(data.sessions)) {
    if (Date.now() > v) delete data.sessions[k]
  }
  
  writeJSON(FILE, data)
  
  // Reset rate limit for this IP on successful login
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 
             c.req.header('x-real-ip') || 
             'unknown'
  resetRateLimitForIp(ip)
  
  return c.json({ token, expiry })
})

/**
 * POST /api/auth/verify
 *
 * Checks if a session token is still valid.
 *
 * @requestBody { token: string }
 * @returns { valid: true } — 200
 * @returns { valid: false } — 401 if expired or unknown
 */
auth.post('/verify', async (c) => {
  const { token } = await c.req.json<{ token: string }>()
  const data = await getAuthData()
  const expiry = data.sessions[token]
  if (!expiry || Date.now() > expiry) return c.json({ valid: false }, 401)
  return c.json({ valid: true })
})

/**
 * POST /api/auth/logout
 *
 * Revokes a session token.
 *
 * @requestBody { token: string }
 * @returns { ok: true } — 200
 */
auth.post('/logout', async (c) => {
  const { token } = await c.req.json<{ token: string }>()
  const data = await getAuthData()
  delete data.sessions[token]
  writeJSON(FILE, data)
  return c.json({ ok: true })
})

/**
 * POST /api/auth/change-password
 *
 * Changes the admin password with bcrypt hashing.
 * Requires the current password for verification.
 *
 * @requestBody { oldPassword: string, newPassword: string }
 * @returns { ok: true } — 200
 * @returns { error: string } — 400 if old password is wrong or new password < 6 chars
 */
auth.post('/change-password', async (c) => {
  const { oldPassword, newPassword } = await c.req.json<{ oldPassword: string; newPassword: string }>()
  const data = await getAuthData()
  
  const isValid = await verifyPassword(oldPassword, data.passwordHash)
  if (!isValid) return c.json({ error: '原密码错误' }, 400)
  if (!newPassword || newPassword.length < 6) return c.json({ error: '新密码至少6位' }, 400)
  
  const salt = await genSalt(BCRYPT_ROUNDS)
  data.passwordHash = await hash(newPassword, salt)
  writeJSON(FILE, data)
  
  return c.json({ ok: true })
})

export default auth
