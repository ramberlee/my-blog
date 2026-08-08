import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import articles from './routes/articles.js'
import config from './routes/config.js'
import auth from './routes/auth.js'
import analytics from './routes/analytics.js'
import upload from './routes/upload.js'
import health from './routes/health.js'
import { logError } from './logger.js'
import { initDB } from './db.js'

// Initialize database
initDB()

const app = new Hono()

// CORS configuration for GitHub Pages
app.use('/*', cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return origin
    
    // Allow GitHub Pages domains
    const allowedOrigins = [
      /\.github\.io$/,
      /localhost/,
      /127\.0\.0\.1/,
      /::1/,
    ]
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin))
    
    // Also check for custom domain from environment
    const customDomain = process.env.ALLOWED_ORIGIN
    if (customDomain && origin === customDomain) return origin
    
    return isAllowed ? origin : null
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'ngrok-skip-browser-warning'],
}))

// API routes
app.route('/api/articles', articles)
app.route('/api/config', config)
app.route('/api/auth', auth)
app.route('/api/analytics', analytics)
app.route('/api/upload', upload)
app.route('/api/health', health)

// CSRF token endpoint
app.get('/api/csrf-token', (c) => {
  const token = crypto.randomUUID()
  return c.json({ csrfToken: token })
})

// Error handling
app.onError((err, c) => {
  logError('Unhandled error', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// Serve static files (frontend build)
app.use('/*', serveStatic({ root: './dist' }))

// Fallback to index.html for SPA routing
app.get('*', serveStatic({ root: './dist', path: 'index.html' }))

const port = parseInt(process.env.PORT || '3001', 10)
console.log(`Server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
