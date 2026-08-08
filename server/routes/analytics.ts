import { Hono } from 'hono'
import { readJSON, writeJSON } from '../storage.js'

interface AnalyticsData {
  totalVisitors: number; todayVisitors: number; pageViews: number
  topPages: { page: string; views: number }[]
  referrers: { source: string; count: number }[]
}

const FILE = 'analytics.json'

const DEFAULT: AnalyticsData = {
  totalVisitors: 1234, todayVisitors: 56, pageViews: 5678,
  topPages: [
    { page: '如何构建个人博客', views: 234 },
    { page: 'React 19 新特性解析', views: 189 },
    { page: '我的2024年计划', views: 156 },
  ],
  referrers: [
    { source: 'Google', count: 456 }, { source: 'Twitter', count: 234 },
    { source: '直接访问', count: 123 }, { source: '微博', count: 89 },
  ],
}

const analytics = new Hono()

analytics.get('/', (c) => c.json(readJSON<AnalyticsData>(FILE, DEFAULT)))

analytics.post('/track', async (c) => {
  const { page, referrer } = await c.req.json<{ page: string; referrer?: string }>()
  const data = readJSON<AnalyticsData>(FILE, DEFAULT)
  data.totalVisitors++; data.todayVisitors++; data.pageViews++
  const topIdx = data.topPages.findIndex(p => p.page === page)
  if (topIdx >= 0) data.topPages[topIdx].views++
  else data.topPages.push({ page, views: 1 })
  data.topPages.sort((a, b) => b.views - a.views)
  if (data.topPages.length > 10) data.topPages = data.topPages.slice(0, 10)
  if (referrer) {
    const refIdx = data.referrers.findIndex(r => r.source === referrer)
    if (refIdx >= 0) data.referrers[refIdx].count++
    else data.referrers.push({ source: referrer, count: 1 })
  }
  writeJSON(FILE, data)
  return c.json({ ok: true })
})

export default analytics
