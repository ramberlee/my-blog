import { Hono } from 'hono'
import { readJSON, writeJSON } from '../storage.js'

/** A blog article stored in the JSON data layer */
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
  /** Custom sort order — lower values appear first */
  order?: number
}

/** Paginated response envelope */
interface PaginatedResponse {
  articles: Article[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

const FILE = 'articles.json'

const DEFAULT_ARTICLES: Article[] = [
  { id: '1', title: '如何构建个人博客', content: '分享我搭建这个博客的过程和心得，从技术选型到设计实现。', category: '技术', tags: ['React', 'TypeScript', '博客'], createdAt: '2024-01-15', updatedAt: '2024-01-15', status: 'published', coverImage: 'https://picsum.photos/seed/blog-dev/800/500' },
  { id: '2', title: 'React 19 新特性解析', content: '深入探讨React 19带来的革命性变化，包括新的编译器和性能优化。', category: '技术', tags: ['React', '前端', '新特性'], createdAt: '2024-01-10', updatedAt: '2024-01-10', status: 'published', coverImage: 'https://picsum.photos/seed/react19/800/500' },
  { id: '3', title: '我的2024年计划', content: '新的一年，新的目标和期待，分享我的年度计划和展望。', category: '生活', tags: ['计划', '目标', '新年'], createdAt: '2024-01-05', updatedAt: '2024-01-05', status: 'draft', coverImage: 'https://picsum.photos/seed/plan2024/800/500' },
]

const articles = new Hono()

/**
 * GET /api/articles
 *
 * Returns articles. Supports optional pagination.
 *
 * Without pagination params → returns `Article[]` (backward compatible).
 * With `page` and/or `limit` → returns `PaginatedResponse`.
 *
 * @queryParam page - 1-based page number (default: 1)
 * @queryParam limit - Items per page (default: 100)
 * @queryParam status - Filter by status ('draft' | 'published')
 */
articles.get('/', (c) => {
  const pageParam = c.req.query('page')
  const limitParam = c.req.query('limit')
  const statusParam = c.req.query('status')

  const hasPagination = pageParam !== undefined || limitParam !== undefined

  let list = readJSON<Article[]>(FILE, DEFAULT_ARTICLES)

  // Filter by status if provided
  if (statusParam === 'published' || statusParam === 'draft') {
    list = list.filter(a => a.status === statusParam)
  }

  // Backward compatible: no pagination params → return raw array
  if (!hasPagination) {
    return c.json(list)
  }

  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const limit = Math.max(1, Math.min(100, parseInt(limitParam ?? '100', 10) || 100))
  const start = (page - 1) * limit
  const end = start + limit
  const sliced = list.slice(start, end)

  const response: PaginatedResponse = {
    articles: sliced,
    total: list.length,
    page,
    limit,
    hasMore: end < list.length,
  }

  return c.json(response)
})

/**
 * GET /api/articles/:id
 *
 * Returns a single article by ID.
 *
 * @param id - Article ID (URL parameter)
 * @returns `Article` → 200
 * @returns `{ error: string }` → 404 if not found
 */
articles.get('/:id', (c) => {
  const list = readJSON<Article[]>(FILE, DEFAULT_ARTICLES)
  const article = list.find(a => a.id === c.req.param('id'))
  if (!article) return c.json({ error: 'Not found' }, 404)
  return c.json(article)
})

/**
 * POST /api/articles
 *
 * Creates a new article. `id`, `createdAt`, and `updatedAt` are auto-generated.
 *
 * @requestBody `Omit<Article, 'id' | 'createdAt' | 'updatedAt'>`
 * @returns `Article` → 201
 *
 * @example
 * ```
 * POST /api/articles
 * { "title": "新文章", "content": "...", "category": "技术", "tags": ["React"], "status": "draft" }
 * → { "id": "1706140800000", "createdAt": "2024-01-25", "updatedAt": "2024-01-25", ... }
 * ```
 */
articles.post('/', async (c) => {
  const body = await c.req.json<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>()
  if (!body.title || !body.title.trim()) return c.json({ error: '标题不能为空' }, 400)
  if (body.title.trim().length > 100) return c.json({ error: '标题不能超过100个字符' }, 400)
  if (!body.content || !body.content.trim()) return c.json({ error: '内容不能为空' }, 400)
  const list = readJSON<Article[]>(FILE, DEFAULT_ARTICLES)
  const now = new Date().toISOString().split('T')[0]
  const article: Article = { ...body, id: Date.now().toString(), createdAt: now, updatedAt: now }
  list.push(article)
  writeJSON(FILE, list)
  return c.json(article, 201)
})


/**
 * PUT /api/articles/reorder
 *
 * Reorders articles by accepting a sorted list of IDs.
 * Assigns incremental order values (0, 1, 2, ...) based on the provided sequence.
 *
 * @requestBody `{ ids: string[] }` — article IDs in desired order
 * @returns `{ ok: true }` — 200
 * @returns `{ error: string }` — 400 if ids is not a non-empty array
 *
 * @example
 * ```
 * PUT /api/articles/reorder
 * { "ids": ["3", "1", "2"] }
 * -> 200 { "ok": true }
 * ```
 */
articles.put('/reorder', async (c) => {
  const body = await c.req.json<{ ids: string[] }>()
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return c.json({ error: 'ids must be a non-empty array' }, 400)
  }
  const list = readJSON<Article[]>(FILE, DEFAULT_ARTICLES)
  const orderMap = new Map(body.ids.map((id: string, i: number) => [id, i]))
  for (const article of list) {
    if (orderMap.has(article.id)) {
      article.order = orderMap.get(article.id)
    }
  }
  writeJSON(FILE, list)
  return c.json({ ok: true })
})

/**
 * PUT /api/articles/:id
 *
 * Updates an existing article. Only provided fields are overwritten.
 * `updatedAt` is refreshed automatically.
 *
 * @param id - Article ID (URL parameter)
 * @requestBody `Partial<Article>`
 * @returns `Article` → 200
 * @returns `{ error: string }` → 404 if not found
 */
articles.put('/:id', async (c) => {
  const body = await c.req.json<Partial<Article>>()
  if (body.title !== undefined && body.title.trim().length > 100) return c.json({ error: '标题不能超过100个字符' }, 400)
  const list = readJSON<Article[]>(FILE, DEFAULT_ARTICLES)
  const idx = list.findIndex(a => a.id === c.req.param('id'))
  if (idx === -1) return c.json({ error: 'Not found' }, 404)
  list[idx] = { ...list[idx], ...body, updatedAt: new Date().toISOString().split('T')[0] }
  writeJSON(FILE, list)
  return c.json(list[idx])
})

/**
 * DELETE /api/articles/:id
 *
 * Deletes an article by ID.
 *
 * @param id - Article ID (URL parameter)
 * @returns `{ ok: true }` → 200
 * @returns `{ error: string }` → 404 if not found
 */
articles.delete('/:id', (c) => {
  const list = readJSON<Article[]>(FILE, DEFAULT_ARTICLES)
  const filtered = list.filter(a => a.id !== c.req.param('id'))
  if (filtered.length === list.length) return c.json({ error: 'Not found' }, 404)
  writeJSON(FILE, filtered)
  return c.json({ ok: true })
})

/**
 * POST /api/articles/import
 *
 * Bulk-imports articles. Each imported article gets a new auto-generated ID
 * to avoid collisions with existing data.
 *
 * @requestBody `Article[]`
 * @returns `{ count: number, total: number }` → 200
 *   - `count` → number of articles imported
 *   - `total` → total articles after merge
 */
articles.post('/import', async (c) => {
  const imported = await c.req.json<Article[]>()
  const list = readJSON<Article[]>(FILE, DEFAULT_ARTICLES)
  const merged = [...list, ...imported.map(a => ({ ...a, id: Date.now() + '-' + a.id }))]
  writeJSON(FILE, merged)
  return c.json({ count: imported.length, total: merged.length })
})

export default articles
