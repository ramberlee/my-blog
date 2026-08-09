import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi, articlesApi, type AnalyticsData, type Article } from '../utils/api'

/** Local calendar date as yyyy-mm-dd. */
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsApi.get(), articlesApi.list()])
      .then(([stats, list]) => { setData(stats); setArticles(list) })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="glass" style={{ borderRadius: 16, padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ borderRadius: 12, padding: '24px 20px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', height: 100 }}>
              <div style={{ width: '40%', height: 12, borderRadius: 4, background: 'var(--c-border)', marginBottom: 12, animation: 'pulse-subtle 1.5s ease-in-out infinite' }} />
              <div style={{ width: '60%', height: 28, borderRadius: 6, background: 'var(--c-border)', animation: 'pulse-subtle 1.5s ease-in-out infinite', animationDelay: '200ms' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const todayKey = localDateKey(new Date())
  const todayEntry = data.daily?.find(x => x.date === todayKey)
  const todayVisits = todayEntry?.visits ?? 0

  const statCards = [
    { label: '总浏览量 (PV)', value: data.pageViews.toLocaleString(), icon: <svg width="20" height="20" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
    { label: '独立访客 (UV)', value: data.totalVisitors.toLocaleString(), icon: <svg width="20" height="20" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: '今日浏览', value: todayVisits.toLocaleString(), icon: <svg width="20" height="20" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: '今日访客', value: data.todayVisitors.toLocaleString(), icon: <svg width="20" height="20" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  ]

  // 近 7 天趋势（缺失日期补 0）
  const trendDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = localDateKey(d)
    const entry = data.daily?.find(x => x.date === key)
    return {
      key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      visits: entry?.visits ?? 0,
    }
  })
  const maxVisits = Math.max(1, ...trendDays.map(x => x.visits))
  const maxReferrer = Math.max(1, ...data.referrers.map(r => r.count))

  const articleTitle = (id: string): string => {
    const found = articles.find(a => a.id === id)
    return found ? found.title : `文章 ${id}`
  }

  return (
    <div className="glass" style={{ borderRadius: 16, padding: 32 }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text-heading)', letterSpacing: '-0.01em' }}>访问统计</h3>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        {statCards.map((stat) => (
          <div key={stat.label} style={{ borderRadius: 12, padding: '20px', background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <div style={{ marginBottom: 12, opacity: 0.7 }}>{stat.icon}</div>
            <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--c-text-heading)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 6 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 近 7 天趋势 */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-heading)', letterSpacing: '0.02em', marginBottom: 16 }}>近 7 天访问趋势</h4>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, padding: '16px 8px 0', borderRadius: 12, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          {trendDays.map((day) => (
            <div key={day.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }} title={`${day.key} · ${day.visits} 次浏览`}>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{day.visits}</div>
              <div style={{ width: '60%', maxWidth: 40, borderRadius: '6px 6px 0 0', background: day.visits > 0 ? 'linear-gradient(180deg, var(--c-accent), #d4a574)' : 'var(--c-border)', height: day.visits > 0 ? `${Math.max(6, (day.visits / maxVisits) * 96)}px` : 4, opacity: day.visits > 0 ? 1 : 0.5 }} />
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{day.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 热门文章 + 来源渠道 */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-heading)', letterSpacing: '0.02em', marginBottom: 16 }}>热门文章</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.topArticles?.length === 0 && <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>暂无数据，访问文章后这里会展示热门文章。</p>}
            {(data.topArticles ?? []).slice(0, 5).map((item, index) => (
              <Link
                key={index}
                to={`/article/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', textDecoration: 'none', transition: 'border-color 0.25s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}
              >
                <span style={{ fontSize: 14, color: 'var(--c-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{articleTitle(item.id)}</span>
                <span style={{ fontSize: 13, color: 'var(--c-text-muted)', fontVariantNumeric: 'tabular-nums', fontWeight: 500, flexShrink: 0, marginLeft: 16 }}>{item.views} 次浏览</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-heading)', letterSpacing: '0.02em', marginBottom: 16 }}>来源渠道</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.referrers.length === 0 && <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>暂无来源数据。</p>}
            {data.referrers.slice(0, 5).map((referrer, index) => {
              const pct = (referrer.count / maxReferrer) * 100
              return (
                <div key={index} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: 'var(--c-text)', fontWeight: 500 }}>{referrer.source}</span>
                    <span style={{ fontSize: 13, color: 'var(--c-text-muted)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {referrer.count} · {Math.round(pct)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--c-border)' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, var(--c-accent), #d4a574)', width: `${pct}%`, transition: 'width 0.8s var(--ease-out-expo)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
