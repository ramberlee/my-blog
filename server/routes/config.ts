import { Hono } from 'hono'
import { readJSON, writeJSON } from '../storage.js'

interface SiteConfig {
  siteName: string; siteDescription: string
  author: { name: string; bio: string; email: string; social: { github?: string; twitter?: string; weibo?: string } }
}

const FILE = 'config.json'

const DEFAULT_CONFIG: SiteConfig = {
  siteName: '个人博客', siteDescription: '用色彩记录生活，用创意点亮世界',
  author: { name: '张三', bio: '一名热爱技术和写作的开发者', email: 'your@email.com', social: { github: 'https://github.com/yourusername', twitter: '', weibo: 'https://weibo.com/yourusername' } },
}

const config = new Hono()

config.get('/', (c) => c.json(readJSON<SiteConfig>(FILE, DEFAULT_CONFIG)))

config.put('/', async (c) => {
  const body = await c.req.json<Partial<SiteConfig>>()
  if (body.siteName !== undefined) {
    if (!body.siteName.trim()) return c.json({ error: '站点名称不能为空' }, 400)
    if (body.siteName.trim().length > 50) return c.json({ error: '站点名称不能超过50个字符' }, 400)
  }
  const current = readJSON<SiteConfig>(FILE, DEFAULT_CONFIG)
  const updated = { ...current, ...body, author: { ...current.author, ...body.author, social: { ...current.author.social, ...body.author?.social } } }
  writeJSON(FILE, updated)
  return c.json(updated)
})

config.post('/reset', (c) => {
  writeJSON(FILE, DEFAULT_CONFIG)
  return c.json(DEFAULT_CONFIG)
})

export default config
