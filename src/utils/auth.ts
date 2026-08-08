const AUTH_TOKEN_KEY = 'blog-auth-token'
const AUTH_EXPIRY_KEY = 'blog-auth-expiry'
const PASSWORD_HASH_KEY = 'blog-admin-pw-hash'
const EXPIRY_MS = 24 * 60 * 60 * 1000

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + 'blog-salt-2024')
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function getStoredHash(): Promise<string> {
  const stored = localStorage.getItem(PASSWORD_HASH_KEY)
  if (stored) return stored
  const h = await hashPassword('admin123')
  localStorage.setItem(PASSWORD_HASH_KEY, h)
  return h
}

export async function verifyPassword(password: string): Promise<boolean> {
  return (await hashPassword(password)) === (await getStoredHash())
}

export async function changePassword(oldPw: string, newPw: string): Promise<boolean> {
  if (!(await verifyPassword(oldPw))) return false
  localStorage.setItem(PASSWORD_HASH_KEY, await hashPassword(newPw))
  return true
}

export function createSession(): string {
  const token = crypto.randomUUID()
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_EXPIRY_KEY, (Date.now() + EXPIRY_MS).toString())
  return token
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const expiry = localStorage.getItem(AUTH_EXPIRY_KEY)
  if (!token || !expiry) return false
  if (Date.now() > parseInt(expiry, 10)) { clearSession(); return false }
  return true
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_EXPIRY_KEY)
}
