const BASE = import.meta.env.VITE_API_BASE ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

/* ©¤©¤ CSRF Token Management ©¤©¤ */
let csrfToken: string | null = null

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken
  const data = await request<{ csrfToken: string }>('/csrf-token')
  csrfToken = data.csrfToken
  sessionStorage.setItem('csrf-token', csrfToken)
  return csrfToken
}

export function clearCsrfToken(): void {
  csrfToken = null
  sessionStorage.removeItem('csrf-token')
}

/* ©¤©¤ Articles ©¤©¤ */
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
    return request<{ articles: Article[]; total: number; page: number; limit: number; hasMore: boolean }>(/articles?)
  },
  get: (id: string) => request<Article>(/articles/),
  create: (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<Article>('/articles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Article>) =>
    request<Article>(/articles/, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ ok: boolean }>(/articles/, { method: 'DELETE' }),
  import: (data: Article[]) =>
    request<{ count: number; total: number }>('/articles/import', { method: 'POST', body: JSON.stringify(data) }),
  reorder: (ids: string[]) =>
    request<{ ok: boolean }>('/articles/reorder', { method: 'PUT', body: JSON.stringify({ ids }) }),
}

/* ©¤©¤ Upload ©¤©¤ */
export const uploadApi = {
  image: async (file: File): Promise<{ url: string; thumbUrl: string; width: number; height: number }> => {
    const formData = new FormData()
    formData.append('image', file)
    const headers: Record<string, string> = {}
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

/* ©¤©¤ Config ©¤©¤ */
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

export const configApi = {
  get: () => request<SiteConfig>('/config'),
  update: (data: Partial<SiteConfig>) => request<SiteConfig>('/config', { method: 'PUT', body: JSON.stringify(data) }),
  reset: () => request<SiteConfig>('/config/reset', { method: 'POST' }),
}

/* ©¤©¤ Auth ©¤©¤ */
export const authApi = {
  login: (password: string) => request<{ token: string; expiry: number }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  verify: (token: string) => request<{ valid: boolean }>('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  logout: (token: string) => request<{ ok: boolean }>('/auth/logout', { method: 'POST', body: JSON.stringify({ token }) }),
  changePassword: (oldPassword: string, newPassword: string) => request<{ ok: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
}

/* ©¤©¤ Analytics ©¤©¤ */
export interface AnalyticsData {
  totalVisitors: number
  todayVisitors: number
  pageViews: number
  topPages: { page: string; views: number }[]
  referrers: { source: string; count: number }[]
}

export const analyticsApi = {
  get: () => request<AnalyticsData>('/analytics'),
  track: (page: string, referrer?: string) => request<{ ok: boolean }>('/analytics/track', { method: 'POST', body: JSON.stringify({ page, referrer }) }),
}
