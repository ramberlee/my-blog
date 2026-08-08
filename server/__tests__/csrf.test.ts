import { describe, it, expect, afterEach } from 'vitest'
import { generateCsrfToken, validateCsrfToken, clearAllCsrfTokens, csrfMiddleware } from '../middleware/csrf.js'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import request from 'supertest'

afterEach(() => {
  clearAllCsrfTokens()
})

describe('CSRF token utility', () => {
  it('generates a hex string token', () => {
    const token = generateCsrfToken('session-1')
    expect(token).toBeTypeOf('string')
    expect(token).toHaveLength(64) // 32 bytes = 64 hex chars
  })

  it('validates a correct token', () => {
    const token = generateCsrfToken('session-1')
    expect(validateCsrfToken('session-1', token)).toBe(true)
  })

  it('rejects an incorrect token', () => {
    generateCsrfToken('session-1')
    expect(validateCsrfToken('session-1', 'wrong-token')).toBe(false)
  })

  it('rejects a token for an unknown session', () => {
    expect(validateCsrfToken('unknown', 'abc')).toBe(false)
  })

  it('regenerating token invalidates the previous one', () => {
    const first = generateCsrfToken('session-1')
    generateCsrfToken('session-1')
    expect(validateCsrfToken('session-1', first)).toBe(false)
  })
})

describe('CSRF token expiry', () => {
  it('rejects an expired token', () => {
    const token = generateCsrfToken('session-exp')

    // Manually expire the token by advancing time
    const originalNow = Date.now
    Date.now = () => originalNow() + 3600001 // 1 hour + 1ms

    expect(validateCsrfToken('session-exp', token)).toBe(false)

    Date.now = originalNow
  })
})

describe('CSRF middleware', () => {
  function createTestApp() {
    const app = new Hono()
    app.use('/api/test', csrfMiddleware)
    app.get('/api/test', (c) => c.json({ ok: true, method: 'GET' }))
    app.post('/api/test', (c) => c.json({ ok: true, method: 'POST' }))
    app.put('/api/test', (c) => c.json({ ok: true, method: 'PUT' }))
    app.delete('/api/test', (c) => c.json({ ok: true, method: 'DELETE' }))
    return app
  }

  it('GET request passes without CSRF token', async () => {
    const app = createTestApp()
    const server = serve({ fetch: app.fetch, port: 0 })

    try {
      const res = await request(server).get('/api/test')
      expect(res.status).toBe(200)
      expect(res.body.method).toBe('GET')
    } finally {
      server.close()
    }
  })

  it('POST without Authorization header returns 401', async () => {
    const app = createTestApp()
    const server = serve({ fetch: app.fetch, port: 0 })

    try {
      const res = await request(server)
        .post('/api/test')
        .set('X-CSRF-Token', 'some-token')
      expect(res.status).toBe(401)
    } finally {
      server.close()
    }
  })

  it('POST without CSRF token returns 403', async () => {
    const app = createTestApp()
    const server = serve({ fetch: app.fetch, port: 0 })

    try {
      const res = await request(server)
        .post('/api/test')
        .set('Authorization', 'Bearer session-abc')
      expect(res.status).toBe(403)
      expect(res.body.error).toContain('CSRF')
    } finally {
      server.close()
    }
  })

  it('POST with invalid CSRF token returns 403', async () => {
    const app = createTestApp()
    const server = serve({ fetch: app.fetch, port: 0 })

    try {
      generateCsrfToken('session-abc')
      const res = await request(server)
        .post('/api/test')
        .set('Authorization', 'Bearer session-abc')
        .set('X-CSRF-Token', 'wrong-token')
      expect(res.status).toBe(403)
    } finally {
      server.close()
    }
  })

  it('POST with valid CSRF token succeeds', async () => {
    const app = createTestApp()
    const server = serve({ fetch: app.fetch, port: 0 })

    try {
      const csrf = generateCsrfToken('session-abc')
      const res = await request(server)
        .post('/api/test')
        .set('Authorization', 'Bearer session-abc')
        .set('X-CSRF-Token', csrf)
      expect(res.status).toBe(200)
      expect(res.body.method).toBe('POST')
    } finally {
      server.close()
    }
  })

  it('PUT with valid CSRF token succeeds', async () => {
    const app = createTestApp()
    const server = serve({ fetch: app.fetch, port: 0 })

    try {
      const csrf = generateCsrfToken('session-abc')
      const res = await request(server)
        .put('/api/test')
        .set('Authorization', 'Bearer session-abc')
        .set('X-CSRF-Token', csrf)
      expect(res.status).toBe(200)
      expect(res.body.method).toBe('PUT')
    } finally {
      server.close()
    }
  })

  it('DELETE with valid CSRF token succeeds', async () => {
    const app = createTestApp()
    const server = serve({ fetch: app.fetch, port: 0 })

    try {
      const csrf = generateCsrfToken('session-abc')
      const res = await request(server)
        .delete('/api/test')
        .set('Authorization', 'Bearer session-abc')
        .set('X-CSRF-Token', csrf)
      expect(res.status).toBe(200)
      expect(res.body.method).toBe('DELETE')
    } finally {
      server.close()
    }
  })
})
