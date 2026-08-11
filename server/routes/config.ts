import { Hono } from 'hono'
import { readJSON, writeJSON } from '../storage.js'

/** A single photography slot rendered in the homepage hero grid. */
interface HeroImage {
  /** Stable id used as a React key while editing. */
  id: string
  /** Public URL or uploaded path of the image. */
  url: string
  /** Accessible description shown to visitors. */
  alt: string
}

interface SiteConfig {
  siteName: string; siteDescription: string
  author: { name: string; bio: string; email: string; social: { github?: string; twitter?: string; weibo?: string } }
  /** Any number of photography images rendered in the homepage hero grid. */
  heroImages: HeroImage[]
}

const FILE = 'config.json'

const DEFAULT_CONFIG: SiteConfig = {
  siteName: '个人博客', siteDescription: '用色彩记录生活，用创意点亮世界',
  author: { name: '张三', bio: '一名热爱技术和写作的开发者', email: 'your@email.com', social: { github: 'https://github.com/yourusername', twitter: '', weibo: 'https://weibo.com/yourusername' } },
  heroImages: [
    { id: 'hero-main', url: 'https://picsum.photos/seed/bloghero/800/500', alt: '城市街头摄影作品' },
    { id: 'hero-side-1', url: 'https://picsum.photos/seed/blogcode/400/300', alt: '自然光影摄影作品' },
    { id: 'hero-side-2', url: 'https://picsum.photos/seed/blognature/400/300', alt: '金色时刻摄影作品' },
  ],
}

/** Merge stored partial config with defaults so every field is present. */
function normalizeConfig(stored: Partial<SiteConfig>): SiteConfig {
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    author: { ...DEFAULT_CONFIG.author, ...stored.author, social: { ...DEFAULT_CONFIG.author.social, ...stored.author?.social } },
    heroImages: stored.heroImages ?? DEFAULT_CONFIG.heroImages,
  }
}

const config = new Hono()

/**
 * GET /api/config
 *
 * Returns the full site configuration with defaults applied.
 * Supports any number of photography images; `heroImages` may also be empty.
 *
 * @returns `SiteConfig` — 200
 *
 * @example
 * ```
 * GET /api/config
 * → { "siteName": "个人博客", "heroImages": [{ "id": "hero-main", ... }] }
 * ```
 */
config.get('/', (c) => {
  const stored = readJSON<Partial<SiteConfig>>(FILE, DEFAULT_CONFIG)
  return c.json(normalizeConfig(stored))
})

/**
 * PUT /api/config
 *
 * Deep-merges partial updates into the stored site configuration. Supports any
 * number of photography images; `heroImages` may also be an empty array.
 *
 * @requestBody `{ siteName?: string, heroImages?: HeroImage[], ... }`
 * @returns `SiteConfig` — 200
 * @returns `{ error: string }` — 400 on invalid input
 *
 * @example
 * ```
 * PUT /api/config
 * { "heroImages": [{ "id": "hero-main", "url": "/uploads/a.jpg", "alt": "街拍" }] }
 * → { "siteName": "个人博客", "heroImages": [...] }
 * ```
 */
config.put('/', async (c) => {
  const body = await c.req.json<Partial<SiteConfig>>()
  if (body.siteName !== undefined) {
    if (!body.siteName.trim()) return c.json({ error: '站点名称不能为空' }, 400)
    if (body.siteName.trim().length > 50) return c.json({ error: '站点名称不能超过50个字符' }, 400)
  }
  if (body.heroImages !== undefined) {
    if (!Array.isArray(body.heroImages)) return c.json({ error: 'heroImages 必须是数组' }, 400)
    const invalid = body.heroImages.some(img =>
      !img || typeof img.id !== 'string' || !img.id.trim()
        || typeof img.url !== 'string' || !img.url.trim()
        || typeof img.alt !== 'string' || !img.alt.trim(),
    )
    if (invalid) return c.json({ error: 'heroImages 每一项必须包含非空的 id、url 和 alt' }, 400)
  }
  const current = readJSON<Partial<SiteConfig>>(FILE, DEFAULT_CONFIG)
  const updated = normalizeConfig({
    ...current,
    ...body,
    author: { ...current.author, ...body.author, social: { ...current.author?.social, ...body.author?.social } },
    heroImages: body.heroImages ?? current.heroImages,
  })
  writeJSON(FILE, updated)
  return c.json(updated)
})

/**
 * POST /api/config/reset
 *
 * Restores the default site configuration.
 *
 * @returns `SiteConfig` — 200
 *
 * @example
 * ```
 * POST /api/config/reset
 * → { "siteName": "个人博客", ... }
 * ```
 */
config.post('/reset', (c) => {
  writeJSON(FILE, DEFAULT_CONFIG)
  return c.json(DEFAULT_CONFIG)
})

export default config
