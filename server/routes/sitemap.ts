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

const FILE = 'articles.json'
const DEFAULT_ARTICLES: Article[] = []

const BASE_URL = process.env.SITE_URL || 'http://localhost:3001'

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function entryToXml(entry: SitemapEntry): string {
  let xml = '  <url>\n'
  xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`
  if (entry.lastmod) xml += `    <lastmod>${entry.lastmod}</lastmod>\n`
  if (entry.changefreq) xml += `    <changefreq>${entry.changefreq}</changefreq>\n`
  if (entry.priority) xml += `    <priority>${entry.priority}</priority>\n`
  xml += '  </url>'
  return xml
}

const sitemap = new Hono()

/**
 * GET /api/sitemap
 *
 * Return an XML sitemap listing static pages (home, articles index,
 * about) and every published article URL. Includes lastmod,
 * changefreq, and priority for each entry.
 *
 * @returns `application/xml` → XML sitemap document → 200
 *
 * @example
 * ```
 * GET /api/sitemap
 * … <?xml version="1.0" encoding="UTF-8"?>
 *   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">—</urlset>
 * ```
 */

sitemap.get('/', (c) => {
  const articles = readJSON<Article[]>(FILE, DEFAULT_ARTICLES)
  const published = articles.filter(a => a.status === 'published')
  const now = new Date().toISOString().split('T')[0]

  const entries: SitemapEntry[] = [
    { loc: BASE_URL + '/', lastmod: now, changefreq: 'daily', priority: '1.0' },
    { loc: BASE_URL + '/articles', lastmod: now, changefreq: 'daily', priority: '0.9' },
    { loc: BASE_URL + '/about', lastmod: now, changefreq: 'monthly', priority: '0.5' },
    ...published.map(a => ({
      loc: `${BASE_URL}/articles/${a.id}`,
      lastmod: a.updatedAt,
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entryToXml).join('\n')}
</urlset>`

  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

export default sitemap
