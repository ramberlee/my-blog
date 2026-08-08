import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSiteConfig, getSiteName, getLogoLetter } from '../hooks/useSiteConfig'
import { Link, useSearchParams } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { articlesApi, type Article } from '../utils/api'
import LazyImage from '../components/LazyImage'
import { calcReadTime } from '../utils/readTime'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

const PAGE_SIZE = 6

const ArticlesPage: React.FC = () => {
  const config = useSiteConfig()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const tagFilter = searchParams.get('tag')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /** Fetch a page of published articles */
  const fetchPage = useCallback(async (page: number, append: boolean) => {
    if (append) setLoadingMore(true)
    try {
      const res = await articlesApi.listPaginated({ page, limit: PAGE_SIZE, status: 'published' })
      setArticles(prev => append ? [...prev, ...res.articles] : res.articles)
      setHasMore(res.hasMore)
      pageRef.current = page
    } finally {
      if (append) setLoadingMore(false)
      else setLoading(false)
    }
  }, [])

  /** Initial load */
  useEffect(() => {
    fetchPage(1, false)
  }, [fetchPage])

  /** Load more handler for infinite scroll */
  const handleLoadMore = useCallback(() => {
    fetchPage(pageRef.current + 1, true)
  }, [fetchPage])

  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    isLoading: loadingMore,
    onLoadMore: handleLoadMore,
  })

  const categories = Array.from(new Set(articles.map(a => a.category)))

  const filtered = articles.filter(a => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q))
    const matchCat = selectedCategory === null || a.category === selectedCategory
    const matchTag = !tagFilter || a.tags.some(t => t.toLowerCase() === tagFilter.toLowerCase())
    return matchSearch && matchCat && matchTag
  })

  /** Reset pagination when search or category filter changes */
  useEffect(() => {
    pageRef.current = 1
    setHasMore(true)
    fetchPage(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, tagFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="text-center">
          <div className="mx-auto mb-4 rounded-full animate-spin" style={{ width: 32, height: 32, border: '2px solid var(--c-border)', borderTopColor: 'var(--c-accent)' }} />
          <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <SEO title="文章" description="探索已发布的文章，记录技术、生活与创意的点滴" />
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{ padding: scrolled ? '10px 0' : '18px 0', background: scrolled ? 'var(--c-nav-bg)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid var(--c-border)' : '1px solid transparent' }}>
        <nav className="mx-auto flex items-center justify-between" style={{ maxWidth: 1200, padding: '0 24px' }}>
          <Link to="/" className="flex items-center gap-3" style={{ fontWeight: 700, fontSize: 18, color: 'var(--c-text-heading)' }}>
            <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--c-accent), #a07850)', fontSize: 14, fontWeight: 800, color: '#fff' }}>{getLogoLetter(config)}</span>
            <span className="hidden sm:inline" style={{ letterSpacing: '-0.02em' }}>{getSiteName(config)}</span>
          </Link>
          <ul className="hidden md:flex items-center" style={{ gap: 4 }}>
            {[{ to: '/', label: '首页' }, { to: '/articles', label: '文章' }, { to: '/about', label: '关于' }].map(item => (
              <li key={item.to}><Link to={item.to} style={{ display: 'block', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: item.to === '/articles' ? 'var(--c-text-heading)' : 'var(--c-text-muted)' }}>{item.label}</Link></li>
            ))}
            <li style={{ marginLeft: 8 }}><Link to="/admin" style={{ display: 'block', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--c-accent)', color: '#fff' }}>后台</Link></li>
          </ul>
          <div className="md:hidden"><Link to="/" style={{ color: 'var(--c-text-muted)' }}><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></Link></div>
        </nav>
      </header>

      <main id="main-content" style={{ paddingTop: 140, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          <div className="" style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Archive</p>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16, color: 'var(--c-text-heading)' }}>文章</h1>
            <p style={{ fontSize: 16, color: 'var(--c-text-muted)', maxWidth: 520, lineHeight: 1.7 }}>记录探索过程中的技术与思考</p>
          </div>

          <div className="" style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-muted)' }} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="搜索文章..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text-heading)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.25s' }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
              </div>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                <button onClick={() => setSelectedCategory(null)} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)', ...(selectedCategory === null ? { background: 'var(--c-accent)', color: '#fff' } : { background: 'var(--c-surface)', color: 'var(--c-text-muted)', border: '1px solid var(--c-border)' }) }}>全部</button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)', ...(selectedCategory === cat ? { background: 'var(--c-accent)', color: '#fff' } : { background: 'var(--c-surface)', color: 'var(--c-text-muted)', border: '1px solid var(--c-border)' }) }}>{cat}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filtered.map(article => (
              <Link key={article.id} to={'/article/' + article.id} className="spotlight-card glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
                {article.coverImage && (
                  <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                    <LazyImage src={article.coverImage} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s var(--ease-out-expo)' }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--c-overlay-strong), transparent 35%)' }} />
                    <div style={{ position: 'absolute', top: 14, left: 14 }}><span style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--c-overlay-strong)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 600, color: 'var(--c-accent)' }}>{article.category}</span></div>
                  </div>
                )}
                <div style={{ padding: '20px 24px' }}>
                  <p style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 8 }}>{article.createdAt} · {calcReadTime(article.content)} min</p>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text-heading)', marginBottom: 8, lineHeight: 1.3 }}>{article.title}</h2>
                  <p style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.6, marginBottom: 16 }}>{article.content.slice(0, 80)}...</p>
                  <div className="flex flex-wrap" style={{ gap: 6 }}>
                    {article.tags.map(tag => (<span key={tag} style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--c-surface)', border: '1px solid var(--c-border)', fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>{tag}</span>))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="" style={{ textAlign: 'center', padding: '80px 0' }}>
              <svg width="48" height="48" fill="none" stroke="var(--c-text-muted)" viewBox="0 0 24 24" style={{ margin: '0 auto 16px', opacity: 0.3 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--c-text-heading)', marginBottom: 8 }}>没有找到匹配的文章</p>
              <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>请尝试其他关键词</p>
            </div>
          )}

          {/* Infinite scroll sentinel + loading indicator */}
          {hasMore && (
            <div ref={loadMoreRef} style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              {loadingMore && (
                <div className="flex items-center gap-3" style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>
                  <span className="inline-block rounded-full animate-pulse" style={{ width: 8, height: 8, background: 'var(--c-accent)' }} />
                  <span className="inline-block rounded-full animate-pulse" style={{ width: 8, height: 8, background: 'var(--c-accent)', animationDelay: '0.15s' }} />
                  <span className="inline-block rounded-full animate-pulse" style={{ width: 8, height: 8, background: 'var(--c-accent)', animationDelay: '0.3s' }} />
                </div>
              )}
            </div>
          )}

          {!hasMore && articles.length > 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-text-muted)', fontSize: 14 }}>
              已加载全部文章
            </div>
          )}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--c-border)' }}>
        <div className="mx-auto" style={{ maxWidth: 1200, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>© {new Date().getFullYear()} {getSiteName(config)}. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  )
}

export default ArticlesPage
