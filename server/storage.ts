import { db } from './db.js'

// Re-export db for direct SQL access
export { db }

/**
 * Reads and parses data from SQLite, mapped to the original JSON file structure.
 * Returns the fallback if the data doesn't exist.
 *
 * @typeParam T - Expected shape of the stored data
 * @param filename - Original JSON filename (used to determine which table to read)
 * @param fallback - Default value returned when no data exists
 * @returns The data from SQLite or the fallback
 *
 * @example
 * ```ts
 * const articles = readJSON<Article[]>('articles.json', [])
 * ```
 */
export function readJSON<T>(filename: string, fallback: T): T {
  try {
    switch (filename) {
      case 'articles.json':
        return readArticles() as T
      case 'config.json':
        return readConfig() as T
      case 'auth.json':
        return readAuth() as T
      case 'analytics.json':
        return readAnalytics() as T
      default:
        return fallback
    }
  } catch {
    return fallback
  }
}

/**
 * Writes data to SQLite, mapped from the original JSON file structure.
 *
 * @typeParam T - Shape of the data to persist
 * @param filename - Original JSON filename (used to determine which table to write)
 * @param data - Value to store
 *
 * @example
 * ```ts
 * writeJSON('articles.json', [{ id: '1', title: 'Hello' }])
 * ```
 */
export function writeJSON<T>(filename: string, data: T): void {
  switch (filename) {
    case 'articles.json':
      writeArticles(data as unknown as Article[])
      break
    case 'config.json':
      writeConfig(data as unknown as Record<string, unknown>)
      break
    case 'auth.json':
      writeAuth(data as unknown as AuthData)
      break
    case 'analytics.json':
      writeAnalytics(data as unknown as AnalyticsData)
      break
  }
}

// --- Internal types ---

interface Article {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  status: string
  coverImage?: string
  order?: number
}

interface AuthData {
  passwordHash: string
  sessions: Record<string, number>
  loginAttempts: number
  lockedUntil: number
}

interface AnalyticsData {
  totalVisitors: number
  todayVisitors: number
  pageViews: number
  topPages: { page: string; views: number }[]
  referrers: { source: string; count: number }[]
  daily: { date: string; visits: number; visitors: number }[]
  visitorIds: string[]
  todayVisitorIds: string[]
  topArticles: { id: string; views: number }[]
}

// --- Articles ---

function readArticles(): Article[] {
  const rows = db.prepare('SELECT * FROM articles ORDER BY "order" ASC, createdAt DESC').all() as Array<{
    id: string; title: string; content: string; category: string
    tags: string; createdAt: string; updatedAt: string
    status: string; coverImage: string | null; order: number | null
  }>
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category,
    tags: JSON.parse(r.tags),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    status: r.status,
    coverImage: r.coverImage ?? undefined,
    order: r.order ?? undefined,
  }))
}

function writeArticles(articles: Article[]): void {
  const deleteAll = db.prepare('DELETE FROM articles')
  const insert = db.prepare(`
    INSERT INTO articles (id, title, content, category, tags, createdAt, updatedAt, status, coverImage, "order")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  db.transaction(() => {
    deleteAll.run()
    for (const a of articles) {
      insert.run(a.id, a.title, a.content, a.category, JSON.stringify(a.tags), a.createdAt, a.updatedAt, a.status, a.coverImage ?? null, a.order ?? null)
    }
  })()
}

// --- Config ---

function readConfig(): Record<string, unknown> {
  const rows = db.prepare('SELECT key, value FROM config').all() as Array<{ key: string; value: string }>
  if (rows.length === 0) return {}
  const result: Record<string, unknown> = {}
  for (const row of rows) {
    const parts = row.key.split('.')
    let current: Record<string, unknown> = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current) || typeof current[parts[i]] !== 'object' || current[parts[i]] === null) {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }
    try {
      current[parts[parts.length - 1]] = JSON.parse(row.value)
    } catch {
      current[parts[parts.length - 1]] = row.value
    }
  }
  return result
}

function writeConfig(obj: Record<string, unknown>, prefix = ''): void {
  const upsert = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)')
  const deleteStale = db.prepare('DELETE FROM config WHERE key LIKE ?')

  db.transaction(() => {
    // Clear existing keys with this prefix
    if (prefix) {
      deleteStale.run(`${prefix}%`)
    } else {
      db.prepare('DELETE FROM config').run()
    }

    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        writeConfig(v as Record<string, unknown>, fullKey)
      } else {
        upsert.run(fullKey, JSON.stringify(v))
      }
    }
  })()
}

// --- Auth ---

function readAuth(): AuthData {
  const hashRow = db.prepare("SELECT value FROM auth WHERE key = 'passwordHash'").get() as { value: string } | undefined
  const passwordHash = hashRow ? JSON.parse(hashRow.value) : ''

  const attemptsRow = db.prepare("SELECT value FROM auth WHERE key = 'loginAttempts'").get() as { value: string } | undefined
  const loginAttempts = attemptsRow ? Number(JSON.parse(attemptsRow.value)) : 0

  const lockRow = db.prepare("SELECT value FROM auth WHERE key = 'lockedUntil'").get() as { value: string } | undefined
  const lockedUntil = lockRow ? Number(JSON.parse(lockRow.value)) : 0

  const sessionRows = db.prepare('SELECT token, expiresAt FROM sessions').all() as Array<{ token: string; expiresAt: number }>
  const sessions: Record<string, number> = {}
  for (const s of sessionRows) {
    sessions[s.token] = s.expiresAt
  }

  return { passwordHash, sessions, loginAttempts, lockedUntil }
}

function writeAuth(data: AuthData): void {
  db.transaction(() => {
    db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)').run('passwordHash', JSON.stringify(data.passwordHash))
    db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)').run('loginAttempts', JSON.stringify(data.loginAttempts ?? 0))
    db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)').run('lockedUntil', JSON.stringify(data.lockedUntil ?? 0))

    // Clean expired sessions and update
    db.prepare('DELETE FROM sessions WHERE expiresAt < ?').run(Date.now())

    const upsert = db.prepare('INSERT OR REPLACE INTO sessions (token, expiresAt) VALUES (?, ?)')
    for (const [token, expiry] of Object.entries(data.sessions)) {
      if (Date.now() <= expiry) {
        upsert.run(token, expiry)
      }
    }
  })()
}

// --- Analytics ---

function readAnalytics(): AnalyticsData {
  const row = db.prepare('SELECT * FROM analytics WHERE id = 1').get() as {
    totalVisitors: number; todayVisitors: number; pageViews: number
    topPages: string; referrers: string
    daily: string; visitorIds: string; todayVisitorIds: string
    topArticles: string
  } | undefined

  if (!row) {
    return { totalVisitors: 0, todayVisitors: 0, pageViews: 0, topPages: [], referrers: [], daily: [], visitorIds: [], todayVisitorIds: [], topArticles: [] }
  }

  return {
    totalVisitors: row.totalVisitors,
    todayVisitors: row.todayVisitors,
    pageViews: row.pageViews,
    topPages: JSON.parse(row.topPages),
    referrers: JSON.parse(row.referrers),
    daily: row.daily ? JSON.parse(row.daily) : [],
    visitorIds: row.visitorIds ? JSON.parse(row.visitorIds) : [],
    todayVisitorIds: row.todayVisitorIds ? JSON.parse(row.todayVisitorIds) : [],
    topArticles: row.topArticles ? JSON.parse(row.topArticles) : [],
  }
}

function writeAnalytics(data: AnalyticsData): void {
  db.prepare(`
    INSERT OR REPLACE INTO analytics (id, totalVisitors, todayVisitors, pageViews, topPages, referrers, daily, visitorIds, todayVisitorIds, topArticles)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.totalVisitors,
    data.todayVisitors,
    data.pageViews,
    JSON.stringify(data.topPages),
    JSON.stringify(data.referrers),
    JSON.stringify(data.daily),
    JSON.stringify(data.visitorIds),
    JSON.stringify(data.todayVisitorIds),
    JSON.stringify(data.topArticles),
  )
}
