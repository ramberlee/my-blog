const BASE = import.meta.env.VITE_API_BASE ?? '/api'

/**
 * 把后端返回的相对资源路径（如 /uploads/xxx.jpg）解析成浏览器可访问的完整 URL。
 * 绝对地址原样返回；BASE 为相对路径（本地代理）时保持同源相对路径。
 */
export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  if (url.startsWith('/')) {
    if (BASE.startsWith('http')) return new URL(url, BASE).origin + url
    return url
  }
  return url
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // ngrok 免费版对浏览器请求的拦截警告页需要此头跳过
    'ngrok-skip-browser-warning': 'true',
    ...((options?.headers as Record<string, string>) ?? {}),
  }

  const method = (options?.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    const token = sessionStorage.getItem('csrf-token')
    if (token) headers['X-CSRF-Token'] = token
  }

  const res = await fetch(BASE + path, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

/* ���� Articles ���� */
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
  order?: number
}

export const articlesApi = {
  list: () => request<Article[]>('/articles'),
  listPaginated: (params: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ articles: Article[]; total: number; page: number; limit: number; hasMore: boolean }>(`/articles?${qs}`)
  },
  get: (id: string) => request<Article>(`/articles/${id}`),
  create: (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<Article>('/articles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Article>) =>
    request<Article>(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ ok: boolean }>(`/articles/${id}`, { method: 'DELETE' }),
  import: (data: Article[]) =>
    request<{ count: number; total: number }>('/articles/import', { method: 'POST', body: JSON.stringify(data) }),
  reorder: (ids: string[]) =>
    request<{ ok: boolean }>('/articles/reorder', { method: 'PUT', body: JSON.stringify({ ids }) }),
}

/* ���� Upload ���� */
export const uploadApi = {
  image: async (file: File): Promise<{ url: string; thumbUrl: string; width: number; height: number }> => {
    const formData = new FormData()
    formData.append('image', file)
    const headers: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' }
    const token = sessionStorage.getItem('csrf-token')
    if (token) headers['X-CSRF-Token'] = token
    const res = await fetch(BASE + '/upload/image', { method: 'POST', body: formData, headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || res.statusText)
    }
    return res.json()
  },
}

/** A single photography slot rendered in the homepage hero grid. */
export interface HeroImage {
  /** Stable id used as a React key while editing. */
  id: string
  /** Public URL or uploaded path of the image. */
  url: string
  /** Accessible description shown to visitors. */
  alt: string
}

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
  /** Three photography images rendered in the homepage hero grid. */
  heroImages: HeroImage[]
}

export const configApi = {
  /** Fetches the full site configuration with defaults applied. */
  get: () => request<SiteConfig>('/config'),
  /** Deep-merges partial updates into the stored site configuration. */
  update: (data: Partial<SiteConfig>) => request<SiteConfig>('/config', { method: 'PUT', body: JSON.stringify(data) }),
  /** Restores the default site configuration. */
  reset: () => request<SiteConfig>('/config/reset', { method: 'POST' }),
}

/* ���� Auth ���� */
export const authApi = {
  login: (password: string) => request<{ token: string; expiry: number }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  verify: (token: string) => request<{ valid: boolean }>('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  logout: (token: string) => request<{ ok: boolean }>('/auth/logout', { method: 'POST', body: JSON.stringify({ token }) }),
  changePassword: (oldPassword: string, newPassword: string) => request<{ ok: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
}

export const analyticsApi = {
  get: () => request<AnalyticsData>('/analytics'),
  track: (page: string, referrer?: string, visitorId?: string) => request<{ ok: boolean }>('/analytics/track', { method: 'POST', body: JSON.stringify({ page, referrer, visitorId }) }),
}

/** Daily visit statistics (PV/UV) for the trend chart. */
export interface DailyStat {
  date: string
  visits: number
  visitors: number
}

/* Analytics */
export interface AnalyticsData {
  totalVisitors: number
  todayVisitors: number
  pageViews: number
  topPages: { page: string; views: number }[]
  referrers: { source: string; count: number }[]
  daily: DailyStat[]
  topArticles: { id: string; views: number }[]
}

const VISITOR_ID_KEY = 'blog-visitor-id'

/**
 * Returns the stable visitor ID stored in localStorage, creating one on
 * first visit. Used to deduplicate unique visitors in analytics.
 */
export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_ID_KEY, id)
  }
  return id
}
