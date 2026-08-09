import { Hono } from 'hono'
import { readJSON, writeJSON } from '../storage.js'

interface DailyEntry {
  date: string
  visits: number
  visitors: number
}

interface AnalyticsData {
  totalVisitors: number
  todayVisitors: number
  pageViews: number
  topPages: { page: string; views: number }[]
  referrers: { source: string; count: number }[]
  daily: DailyEntry[]
  visitorIds: string[]
  todayVisitorIds: string[]
  topArticles: { id: string; views: number }[]
}

const FILE = 'analytics.json'
const DAILY_WINDOW = 30
const MAX_VISITOR_IDS = 10000

const DEFAULT: AnalyticsData = {
  totalVisitors: 0, todayVisitors: 0, pageViews: 0,
  topPages: [],
  referrers: [],
  daily: [],
  visitorIds: [],
  todayVisitorIds: [],
  topArticles: [],
}

/** Returns the local calendar date as yyyy-mm-dd. */
function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const analytics = new Hono()

/**
 * GET /api/analytics
 *
 * Returns aggregated visit statistics. Visitor ID sets are internal-only
 * and stripped from the public response.
 *
 * @returns `AnalyticsData` — 200
 */
analytics.get('/', (c) => {
  const data = readJSON<AnalyticsData>(FILE, DEFAULT)
  const { visitorIds: _v, todayVisitorIds: _t, ...publicData } = data
  return c.json(publicData)
})

/**
 * POST /api/analytics/track
 *
 * Records one page view. PV increments on every call; UV is deduplicated by
 * the visitorId generated client-side. Keeps a 30-day daily history and
 * ranked page/referrer lists.
 *
 * @requestBody `{ page: string, referrer?: string, visitorId?: string }`
 * @returns `{ ok: true }` — 200
 */
analytics.post('/track', async (c) => {
  const { page, referrer, visitorId } = await c.req.json<{ page: string; referrer?: string; visitorId?: string }>()
  const data = readJSON<AnalyticsData>(FILE, DEFAULT)
  const today = localDateKey()

  // PV
  data.pageViews++

  // Daily history
  data.daily = data.daily ?? []
  let day = data.daily.find(d => d.date === today)
  if (!day) {
    day = { date: today, visits: 0, visitors: 0 }
    data.daily.push(day)
  }
  day.visits++

  // UV (deduplicated by visitorId)
  if (visitorId) {
    data.todayVisitorIds = data.todayVisitorIds ?? []
    if (!data.todayVisitorIds.includes(visitorId)) {
      data.todayVisitorIds.push(visitorId)
      data.todayVisitors = (data.todayVisitors ?? 0) + 1
      day.visitors++
    }
    data.visitorIds = data.visitorIds ?? []
    if (!data.visitorIds.includes(visitorId)) {
      data.visitorIds.push(visitorId)
      data.totalVisitors = (data.totalVisitors ?? 0) + 1
    }
  }

  // Top pages
  const topIdx = data.topPages.findIndex(p => p.page === page)
  if (topIdx >= 0) data.topPages[topIdx].views++
  else data.topPages.push({ page, views: 1 })
  data.topPages.sort((a, b) => b.views - a.views)
  if (data.topPages.length > 10) data.topPages = data.topPages.slice(0, 10)

  // Top articles (only for article detail pages)
  const articleMatch = page.match(/(?:^|\/)article\/([^/?#]+)/)
  if (articleMatch) {
    const articleId = articleMatch[1]
    data.topArticles = data.topArticles ?? []
    const artIdx = data.topArticles.findIndex(a => a.id === articleId)
    if (artIdx >= 0) data.topArticles[artIdx].views++
    else data.topArticles.push({ id: articleId, views: 1 })
    data.topArticles.sort((a, b) => b.views - a.views)
    if (data.topArticles.length > 10) data.topArticles = data.topArticles.slice(0, 10)
  }

  // Referrers
  if (referrer) {
    const refIdx = data.referrers.findIndex(r => r.source === referrer)
    if (refIdx >= 0) data.referrers[refIdx].count++
    else data.referrers.push({ source: referrer, count: 1 })
  }

  // Prune history and cap visitor ID lists
  data.daily.sort((a, b) => a.date.localeCompare(b.date))
  if (data.daily.length > DAILY_WINDOW) data.daily = data.daily.slice(-DAILY_WINDOW)
  if (data.visitorIds.length > MAX_VISITOR_IDS) data.visitorIds = data.visitorIds.slice(-MAX_VISITOR_IDS)
  if (data.todayVisitorIds.length > MAX_VISITOR_IDS) data.todayVisitorIds = data.todayVisitorIds.slice(-MAX_VISITOR_IDS)

  writeJSON(FILE, data)
  return c.json({ ok: true })
})

export default analytics
