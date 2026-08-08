import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import articles from './routes/articles.js'
import config from './routes/config.js'
import auth from './routes/auth.js'
import analytics from './routes/analytics.js'
import upload from './routes/upload.js'
import rss from './routes/rss.js'
import sitemap from './routes/sitemap.js'
import { logError } from './logger.js'
import { csrfMiddleware, generateCsrfToken } from './middleware/csrf.js'
import { readJSON } from './storage.js'
import { initDB } from './db.js'

// Initialize SQLite database and migrate from JSON if needed
initDB()

interface AuthData {
  passwordHash: string
  sessions: Record<string, number>
}

const app = new Hono()

app.use('/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE'] }))

// CSRF token endpoint — requires a valid session
app.get('/api/csrf-token', (c) => {
  const authHeader = c.req.header('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  if (!token) return c.json({ error: '缺少认证信息' }, 401)

  const data = readJSON<AuthData>('auth.json', { passwordHash: '', sessions: {} })
  const expiry = data.sessions[token]
  if (!expiry || Date.now() > expiry) return c.json({ error: '会话已过期' }, 401)

  const csrfToken = generateCsrfToken(token)
  return c.json({ csrfToken })
})

// Apply CSRF protection to state-changing routes (POST / PUT / DELETE)
// Safe methods (GET / HEAD / OPTIONS) are skipped by the middleware
app.use('/api/articles', csrfMiddleware)
app.use('/api/articles/*', csrfMiddleware)
app.use('/api/config', csrfMiddleware)
app.use('/api/config/*', csrfMiddleware)
app.use('/api/auth/change-password', csrfMiddleware)
app.use('/api/upload/*', csrfMiddleware)

app.route('/api/articles', articles)
app.route('/api/config', config)
app.route('/api/auth', auth)
app.route('/api/analytics', analytics)
app.route('/api/upload', upload)
app.route('/api/rss', rss)
app.route('/api/sitemap', sitemap)

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() })
})

app.onError((err, c) => {
  logError(`Unhandled error on ${c.req.method} ${c.req.path}`, err instanceof Error ? err : new Error(String(err)))
  return c.json({ error: 'Internal server error' }, 500)
})

app.use('/uploads/*', serveStatic({ root: './server' }))
app.use('/*', serveStatic({ root: './dist' }))
app.get('*', serveStatic({ root: './dist', path: 'index.html' }))

const port = Number(process.env.PORT) || 3001
console.log(`Server running on http://localhost:${port} [env=${process.env.NODE_ENV ?? 'development'}]`)
serve({ fetch: app.fetch, port })
