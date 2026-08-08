const BASE = '/api'

/* -- Auth token & CSRF helpers -- */

const TOKEN_KEY = 'blog-auth-token'

/** Cached CSRF token (fetched on demand for state-changing requests) */
let cachedCsrf: string | null = null

/**
 * Fetches a CSRF token from the server using the current session.
 * Caches the result until `clearCsrfToken` is called.
 */
async function getCsrfToken(): Promise<string> {
  if (cachedCsrf) return cachedCsrf
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) throw new Error('δ��¼')
  const res = await fetch(BASE + '/csrf-token', {
    headers: { Authorization: 'Bearer ' + token },
  })
  if (!res.ok) throw new Error('��ȡ CSRF token ʧ��')
  const data = await res.json()
  cachedCsrf = data.csrfToken
  return cachedCsrf!
}

/** Clears the cached CSRF token (e.g. on logout) */
export function clearCsrfToken(): void { cachedCsrf = null }

/**
 * Generic fetch wrapper for the blog API.
 * Automatically prepends the `/api` base path, sets JSON content type,
 * attaches Authorization + CSRF headers for state-changing requests,
 * and throws on non-OK responses with the server's error message.
 *
 * @typeParam T - Expected response shape
 * @param path - Path relative to `/api` (e.g. '/articles')
 * @param options - Standard fetch options (method, body, headers, etc.)
 * @returns Parsed JSON response
 * @throws {Error} With the server's error message on non-2xx responses
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  // Attach auth token for all requests
  const authToken = localStorage.getItem(TOKEN_KEY)
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken

  // Attach CSRF token for state-changing methods
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    try { headers['X-CSRF-Token'] = await getCsrfToken() } catch { /* not logged in �� skip */ }
  }

  const res = await fetch(BASE + path, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

/* -- Articles -- */

/** A blog article as returned by the API */
export interface Article {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  status: 'draft' | 'published'
  coverImage?: string
  /** Custom sort order �?lower values appear first */
  order?: number
}

/** Paginated articles response */
export interface PaginatedArticles {
  articles: Article[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/** Optional pagination parameters for article listing */
export interface ArticleListParams {
  page?: number
  limit?: number
  status?: 'draft' | 'published'
}

/** Article CRUD + import API client */
export const articlesApi = {
  /** Fetches all articles (draft + published) -- backward compatible */
  list: () => request<Article[]>('/articles'),
  /** Fetches a paginated, optionally filtered subset of articles */
  listPaginated: (params: ArticleListParams) => {
    const qs = new URLSearchParams()
    if (params.page !== undefined) qs.set('page', String(params.page))
    if (params.limit !== undefined) qs.set('limit', String(params.limit))
    if (params.status) qs.set('status', params.status)
    return request<PaginatedArticles>('/articles?' + qs.toString())
  },
  /** Fetches a single article by ID. Throws if not found. */
  get: (id: string) => request<Article>(`/articles/${id}`),
  /** Creates a new article. `id`, `createdAt`, `updatedAt` are auto-generated. */
  create: (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => request<Article>('/articles', { method: 'POST', body: JSON.stringify(data) }),
  /** Partially updates an existing article. `updatedAt` is refreshed. */
  update: (id: string, data: Partial<Article>) => request<Article>(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  /** Deletes an article by ID. */
  delete: (id: string) => request<{ ok: boolean }>(`/articles/${id}`, { method: 'DELETE' }),
  /** Bulk-imports articles with auto-generated IDs. */
  import: (data: Article[]) => request<{ count: number; total: number }>('/articles/import', { method: 'POST', body: JSON.stringify(data) }),
  /** Reorders articles by ID list. Saves the new order to the backend. */
  reorder: (ids: string[]) => request<{ ok: boolean }>('/articles/reorder', { method: 'PUT', body: JSON.stringify({ ids }) }),
}

/* -- Config -- */

/** Site configuration shape */
export interface SiteConfig {
  siteName: string
  siteDescription: string
  author: {
    name: string
    avatar?: string
    bio: string
    email: string
    social: { github?: string; twitter?: string; weibo?: string }
  }
}

/** Site configuration API client */
export const configApi = {
  /** Fetches the current site configuration */
  get: () => request<SiteConfig>('/config'),
  /** Partially updates the site configuration (deep merge) */
  update: (data: Partial<SiteConfig>) => request<SiteConfig>('/config', { method: 'PUT', body: JSON.stringify(data) }),
  /** Resets configuration to defaults */
  reset: () => request<SiteConfig>('/config/reset', { method: 'POST' }),
}

/* -- Auth -- */

/** Authentication API client */
export const authApi = {
  /** Logs in and returns a 24-hour session token */
  login: (password: string) => request<{ token: string; expiry: number }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  /** Checks if a session token is still valid */
  verify: (token: string) => request<{ valid: boolean }>('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  /** Revokes a session token */
  logout: (token: string) => request<{ ok: boolean }>('/auth/logout', { method: 'POST', body: JSON.stringify({ token }) }),
  /** Changes the admin password (requires current password) */
  changePassword: (oldPassword: string, newPassword: string) => request<{ ok: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
}

/** Health check API client */
export const healthApi = {
  /** Returns server health status, uptime, and timestamp */
  check: () => request<{ status: string; uptime: number; timestamp: string }>('/health'),
}

/* -- Analytics -- */

/** Analytics dashboard data */
export interface AnalyticsData {
  totalVisitors: number
  todayVisitors: number
  pageViews: number
  topPages: { page: string; views: number }[]
  referrers: { source: string; count: number }[]
}

/** Upload API client */
export const uploadApi = {
  /** Uploads an image file and returns the public URL path */
  image: async (file: File): Promise<{ url: string; thumbUrl: string; width: number; height: number }> => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch(BASE + '/upload/image', {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || res.statusText)
    }
    return res.json()
  },
}

export const analyticsApi = {
  /** Fetches the current analytics dashboard data */
  get: () => request<AnalyticsData>('/analytics'),
  /** Records a page view (increments counters and updates top pages/referrers) */
  track: (page: string, referrer?: string) => request<{ ok: boolean }>('/analytics/track', { method: 'POST', body: JSON.stringify({ page, referrer }) }),
}
