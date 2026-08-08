import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const DB_PATH = join(DATA_DIR, 'blog.db')

/** SQLite database instance */
export const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/**
 * Initialize database tables.
 * Safe to call multiple times — uses IF NOT EXISTS.
 */
export function initTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      coverImage TEXT,
      "order" INTEGER
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      totalVisitors INTEGER NOT NULL DEFAULT 0,
      todayVisitors INTEGER NOT NULL DEFAULT 0,
      pageViews INTEGER NOT NULL DEFAULT 0,
      topPages TEXT NOT NULL DEFAULT '[]',
      referrers TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS auth (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      expiresAt INTEGER NOT NULL
    );
  `)
}

/**
 * Migrate data from JSON files into SQLite.
 * Only runs if the SQLite database is empty (no articles) and JSON files exist.
 * Preserves JSON files as backup after migration.
 */
export function migrateFromJSON(): void {
  const articleCount = db.prepare('SELECT COUNT(*) as cnt FROM articles').get() as { cnt: number }
  if (articleCount.cnt > 0) return // Already has data, skip migration

  // Migrate articles
  const articlesPath = join(DATA_DIR, 'articles.json')
  if (existsSync(articlesPath)) {
    try {
      const articles = JSON.parse(readFileSync(articlesPath, 'utf-8')) as Array<{
        id: string; title: string; content: string; category: string
        tags: string[]; createdAt: string; updatedAt: string
        status: string; coverImage?: string; order?: number
      }>
      if (articles.length > 0) {
        const insert = db.prepare(`
          INSERT OR REPLACE INTO articles (id, title, content, category, tags, createdAt, updatedAt, status, coverImage, "order")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        const insertMany = db.transaction((items: typeof articles) => {
          for (const a of items) {
            insert.run(a.id, a.title, a.content, a.category, JSON.stringify(a.tags), a.createdAt, a.updatedAt, a.status, a.coverImage ?? null, a.order ?? null)
          }
        })
        insertMany(articles)
        console.log(`[db] Migrated ${articles.length} articles from JSON`)
      }
    } catch (e) {
      console.error('[db] Failed to migrate articles.json:', e)
    }
  }

  // Migrate config
  const configPath = join(DATA_DIR, 'config.json')
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      const insert = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)')
      const insertConfig = db.transaction((obj: Record<string, unknown>, prefix = '') => {
        for (const [k, v] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${k}` : k
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            insertConfig(v as Record<string, unknown>, fullKey)
          } else {
            insert.run(fullKey, JSON.stringify(v))
          }
        }
      })
      insertConfig(config)
      console.log('[db] Migrated config from JSON')
    } catch (e) {
      console.error('[db] Failed to migrate config.json:', e)
    }
  }

  // Migrate analytics
  const analyticsPath = join(DATA_DIR, 'analytics.json')
  if (existsSync(analyticsPath)) {
    try {
      const data = JSON.parse(readFileSync(analyticsPath, 'utf-8'))
      db.prepare(`
        INSERT OR REPLACE INTO analytics (id, totalVisitors, todayVisitors, pageViews, topPages, referrers)
        VALUES (1, ?, ?, ?, ?, ?)
      `).run(data.totalVisitors, data.todayVisitors, data.pageViews, JSON.stringify(data.topPages), JSON.stringify(data.referrers))
      console.log('[db] Migrated analytics from JSON')
    } catch (e) {
      console.error('[db] Failed to migrate analytics.json:', e)
    }
  }

  // Migrate auth
  const authPath = join(DATA_DIR, 'auth.json')
  if (existsSync(authPath)) {
    try {
      const data = JSON.parse(readFileSync(authPath, 'utf-8'))
      db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)').run('passwordHash', JSON.stringify(data.passwordHash))
      db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)').run('loginAttempts', JSON.stringify(data.loginAttempts ?? 0))
      db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)').run('lockedUntil', JSON.stringify(data.lockedUntil ?? 0))
      // Migrate sessions
      if (data.sessions && typeof data.sessions === 'object') {
        const insertSession = db.prepare('INSERT OR REPLACE INTO sessions (token, expiresAt) VALUES (?, ?)')
        const insertSessions = db.transaction((sessions: Record<string, number>) => {
          for (const [token, expiry] of Object.entries(sessions)) {
            if (Date.now() <= expiry) {
              insertSession.run(token, expiry)
            }
          }
        })
        insertSessions(data.sessions)
      }
      console.log('[db] Migrated auth from JSON')
    } catch (e) {
      console.error('[db] Failed to migrate auth.json:', e)
    }
  }
}

/**
 * Full database initialization: create tables and migrate from JSON if needed.
 * Call this once on server startup.
 */
export function initDB(): void {
  initTables()
  migrateFromJSON()
}
