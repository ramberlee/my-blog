import React, { useEffect, useState } from 'react'
import { articlesApi, analyticsApi } from '../../utils/api'

const StatsRow: React.FC = () => {
  const [stats, setStats] = useState([
    { value: '—', label: '篇文章', loading: true },
    { value: '—', label: '位读者', loading: true },
    { value: '—', label: '天运营', loading: true },
    { value: '—', label: '个标签', loading: true },
  ])

  useEffect(() => {
    Promise.allSettled([articlesApi.list(), analyticsApi.get()]).then(([articlesRes, analyticsRes]) => {
      const articles = articlesRes.status === 'fulfilled' ? articlesRes.value : []
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null

      const publishedCount = articles.filter(a => a.status === 'published').length
      const allTags = new Set(articles.flatMap(a => a.tags))

      // Calculate days since first article
      let daysRunning = 0
      if (articles.length > 0) {
        const dates = articles.map(a => new Date(a.createdAt).getTime())
        const earliest = Math.min(...dates)
        daysRunning = Math.max(1, Math.floor((Date.now() - earliest) / (1000 * 60 * 60 * 24)))
      }

      setStats([
        { value: String(publishedCount), label: '篇文章', loading: false },
        { value: analytics ? analytics.totalVisitors.toLocaleString() : '—', label: '位读者', loading: false },
        { value: String(daysRunning), label: '天运营', loading: false },
        { value: String(allTags.size), label: '个标签', loading: false },
      ])
    })
  }, [])

  return (
    <section aria-label="统计数据" style={{ padding: '80px 24px' }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 16 }}>
          {stats.map((stat) => (
            <div key={stat.label} className="glass" style={{ borderRadius: 16, padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--c-text-heading)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 8, opacity: stat.loading ? 0.3 : 1, transition: 'opacity 0.5s' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-muted)', letterSpacing: '0.02em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsRow
