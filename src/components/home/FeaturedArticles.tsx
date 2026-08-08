import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { articlesApi, type Article } from '../../utils/api'
import LazyImage from '../LazyImage'
import { calcReadTime } from '../../utils/readTime'

function useSpotlight() {
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const cards = e.currentTarget.querySelectorAll('.spotlight-card')
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      ;(card as HTMLElement).style.setProperty('--mouse-x', `${x}%`)
      ;(card as HTMLElement).style.setProperty('--mouse-y', `${y}%`)
    })
  }, [])
  return handleMouseMove
}

const PLACEHOLDER_IMG = 'https://picsum.photos/seed/blog/800/500'

const FeaturedArticles: React.FC = () => {
  const handleSpotlight = useSpotlight()
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    articlesApi.list()
      .then(all => setArticles(all.filter(a => a.status === 'published').slice(0, 3)))
      .catch(console.error)
  }, [])

  if (articles.length === 0) return null

  return (
    <section aria-label="精选文章" style={{ padding: '80px 24px' }} onMouseMove={handleSpotlight}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <div className="flex items-end justify-between" style={{ marginBottom: 48 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Latest</p>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--c-text-heading)' }}>精选文章</h2>
          </div>
          <Link to="/articles" className="hidden md:inline-flex items-center" style={{ gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--c-text-muted)', transition: 'color 0.25s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-accent)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-muted)')}>
            查看全部
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
          <div className="md:grid" style={{ display: 'block', gridTemplateColumns: '1.3fr 0.7fr', gap: 16 }}>
            {/* Featured large */}
            <Link to={`/article/${articles[0].id}`} className="spotlight-card glass" style={{ borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                <LazyImage src={articles[0].coverImage || PLACEHOLDER_IMG} alt={articles[0].title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s var(--ease-out-expo)' }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--c-overlay-strong) 0%, transparent 35%)' }} />
                <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                  <p style={{ fontSize: 12, color: 'var(--c-accent)', fontWeight: 600, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{articles[0].createdAt} · {calcReadTime(articles[0].content)} min</p>
                  <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{articles[0].title}</h3>
                </div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ color: 'var(--c-text-muted)', fontSize: 14, lineHeight: 1.7 }}>{articles[0].content.slice(0, 60) + '...'}</p>
              </div>
            </Link>

            {/* Two stacked smaller */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {articles.slice(1).map((article) => (
                <Link key={article.id} to={`/article/${article.id}`} className="spotlight-card glass" style={{ borderRadius: 16, overflow: 'hidden', display: 'flex', flex: 1 }}>
                  <div style={{ width: '40%', minWidth: 140, overflow: 'hidden', flexShrink: 0 }}>
                    <LazyImage src={article.coverImage || PLACEHOLDER_IMG} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s var(--ease-out-expo)' }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                  </div>
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                    <p style={{ fontSize: 11, color: 'var(--c-accent)', fontWeight: 600, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{article.createdAt} · {calcReadTime(article.content)} min</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text-heading)', letterSpacing: '-0.01em', marginBottom: 8, lineHeight: 1.3 }}>{article.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>{article.content.slice(0, 60) + '...'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedArticles
