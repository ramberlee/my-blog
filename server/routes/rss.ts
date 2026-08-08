import { Hono } from 'hono'
import { readJSON } from '../storage.js'

interface Article {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  status: 'draft' | 'published'
  coverImage?: string
}

interface SiteConfig {
  siteName: string
  siteDescription: string
  author: { name: string; email: string }
}

const FILE_ARTICLES = 'articles.json'
const FILE_CONFIG = 'config.json'

const DEFAULT_ARTICLES: Article[] = []
const DEFAULT_CONFIG: SiteConfig = {
  siteName: "Ramber's Blog",
  siteDescription: 'Share tech articles, life notes, and creative works',
  author: { name: 'Ramber', email: 'lirobinho@sina.cn' },
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(text: string, maxLen: number): string {
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return clean.length > maxLen ? clean.slice(0, maxLen) + '...' : clean
}

const rss = new Hono()

/**
 * GET /api/rss
 *
 * Return an RSS 2.0 feed of all published articles, sorted by
 * last-updated date descending. Uses site name, description, and
 * author info from the stored SiteConfig.
 *
 * @returns `application/xml` → RSS 2.0 XML document → 200
 *
 * @example
 * ```
 * GET /api/rss
 * → <?xml version="1.0" encoding="UTF-8"?>
 *   <rss version="2.0">→</rss>
 * ```
 */

rss.get('/', (c) => {
  const config = readJSON<SiteConfig>(FILE_CONFIG, DEFAULT_CONFIG)
  const articles = readJSON<Article[]>(FILE_ARTICLES, DEFAULT_ARTICLES)
  const published = articles.filter(a => a.status === 'published')
  const baseUrl = process.env.SITE_URL || 'http://localhost:3001'

  const items = published
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(a => `    <item>
      <title>${escapeXml(a.title)}</title>
      <description>${escapeXml(truncate(a.content, 200))}</description>
      <link>${baseUrl}/articles/${a.id}</link>
      <guid isPermaLink="true">${baseUrl}/articles/${a.id}</guid>
      <pubDate>${new Date(a.updatedAt).toUTCString()}</pubDate>
      <category>${escapeXml(a.category)}</category>
    </item>`)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.siteName)}</title>
    <description>${escapeXml(config.siteDescription)}</description>
    <link>${baseUrl}</link>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <managingEditor>${escapeXml(config.author.email)} (${escapeXml(config.author.name)})</managingEditor>
    <webMaster>${escapeXml(config.author.email)} (${escapeXml(config.author.name)})</webMaster>
${items}
  </channel>
</rss>`

  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

export default rss
