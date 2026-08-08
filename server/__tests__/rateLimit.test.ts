import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { serve } from '@hono/node-server'
import request from 'supertest'
import { Hono } from 'hono'
import { rateLimit, resetRateLimitForIp, clearAllRateLimits } from '../middleware/rateLimit.js'

describe('Rate Limiter Middleware', () => {
  let server: ReturnType<typeof serve>

  beforeEach(() => {
    clearAllRateLimits()
  })

  afterEach(() => {
    if (server) server.close()
  })

  function createApp(max = 3, window = 1000) {
    const app = new Hono()
    app.use('/test', rateLimit(max, window))
    app.post('/test', (c) => c.json({ ok: true }))
    return app
  }

  function getPort(s: ReturnType<typeof serve>): number {
    return (s.address() as any).port
  }

  it('allows requests within the limit', async () => {
    server = serve({ fetch: createApp().fetch, port: 0 })
    for (let i = 0; i < 3; i++) {
      const res = await request(`http://localhost:${getPort(server)}`).post('/test')
      expect(res.status).toBe(200)
    }
  })

  it('returns 429 when limit exceeded', async () => {
    server = serve({ fetch: createApp().fetch, port: 0 })
    const port = getPort(server)
    for (let i = 0; i < 3; i++) await request(`http://localhost:${port}`).post('/test')

    const res = await request(`http://localhost:${port}`).post('/test')
    expect(res.status).toBe(429)
    expect(res.body.error).toContain('请求过于频繁')
    expect(res.headers['retry-after']).toBeDefined()
    expect(res.headers['x-ratelimit-remaining']).toBe('0')
  })

  it('includes rate limit headers on first request', async () => {
    server = serve({ fetch: createApp().fetch, port: 0 })
    const res = await request(`http://localhost:${getPort(server)}`).post('/test')
    expect(res.headers['x-ratelimit-limit']).toBe('3')
    expect(res.headers['x-ratelimit-remaining']).toBe('2')
  })

  it('decrements remaining count', async () => {
    server = serve({ fetch: createApp().fetch, port: 0 })
    const port = getPort(server)
    await request(`http://localhost:${port}`).post('/test')
    const res = await request(`http://localhost:${port}`).post('/test')
    expect(res.headers['x-ratelimit-remaining']).toBe('1')
  })

  it('resetRateLimitForIp clears the counter', async () => {
    server = serve({ fetch: createApp(2, 1000).fetch, port: 0 })
    const port = getPort(server)

    // Exhaust limit
    await request(`http://localhost:${port}`).post('/test')
    await request(`http://localhost:${port}`).post('/test')

    // Verify blocked
    const blocked = await request(`http://localhost:${port}`).post('/test')
    expect(blocked.status).toBe(429)

    // Reset externally (simulates successful login callback)
    resetRateLimitForIp('unknown')

    // Should work again
    const res = await request(`http://localhost:${port}`).post('/test')
    expect(res.status).toBe(200)
  })

  it('returns correct remaining after multiple requests', async () => {
    server = serve({ fetch: createApp(5, 1000).fetch, port: 0 })
    const port = getPort(server)

    const remaining = []
    for (let i = 0; i < 5; i++) {
      const res = await request(`http://localhost:${port}`).post('/test')
      remaining.push(res.headers['x-ratelimit-remaining'])
    }
    expect(remaining).toEqual(['4', '3', '2', '1', '0'])
  })
})
