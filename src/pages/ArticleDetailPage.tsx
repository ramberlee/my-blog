import React, { useState, useEffect } from 'react'
import { useSiteConfig, getSiteName, getLogoLetter } from '../hooks/useSiteConfig'
import { Link, useParams } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { articlesApi, type Article } from '../utils/api'
import LazyImage from '../components/LazyImage'
import { useRenderedMarkdown } from '../hooks/useRenderedMarkdown'
import { calcReadTime } from '../utils/readTime'
import ReadingProgress from '../components/ReadingProgress'

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const config = useSiteConfig()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [copied, setCopied] = useState(false)
  const { html: renderedContent, loading: mdLoading } = useRenderedMarkdown(article?.content ?? null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!id) return
    setLoading(true)
    setNotFound(false)
    articlesApi.get(id)
      .then(setArticle)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const shareToTwitter = () => {
    if (!article) return
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(article.title) + '&url=' + encodeURIComponent(window.location.href), '_blank')
  }

  const shareToWeibo = () => {
    if (!article) return
    window.open('https://service.weibo.com/share/share.php?title=' + encodeURIComponent(article.title) + '&url=' + encodeURIComponent(window.location.href), '_blank')
  }

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }



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

  if (notFound || !article) {
    return (
      <>
        <SEO title="文章未找到" description="该文章不存在或已被删除" />
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 64, fontWeight: 800, color: 'var(--c-text-heading)', marginBottom: 12 }}>404</h1>
          <p style={{ fontSize: 16, color: 'var(--c-text-muted)', marginBottom: 32 }}>文章不存在或已被删除</p>
          <Link to="/articles" style={{ padding: '12px 32px', borderRadius: 10, background: 'var(--c-accent)', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>返回文章列表</Link>
        </div>
      </div>
      </>
    )
  }
  const description = article.content.slice(0, 150).replace(/[#*\n]/g, ' ').trim() + '...'
  const seoUrl = window.location.href
  const seoImage = article.coverImage || undefined

  return (
    <div className="min-h-screen">
      <SEO title={article.title} description={description} image={seoImage} url={seoUrl} type="article" />
      <ReadingProgress />
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{ padding: scrolled ? '10px 0' : '18px 0', background: scrolled ? 'var(--c-nav-bg)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid var(--c-border)' : '1px solid transparent' }}>
        <nav className="mx-auto flex items-center justify-between" style={{ maxWidth: 1200, padding: '0 24px' }}>
          <Link to="/" className="flex items-center gap-3" style={{ fontWeight: 700, fontSize: 18, color: 'var(--c-text-heading)' }}>
            <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--c-accent), #a07850)', fontSize: 14, fontWeight: 800, color: '#fff' }}>{getLogoLetter(config)}</span>
            <span className="hidden sm:inline" style={{ letterSpacing: '-0.02em' }}>{getSiteName(config)}</span>
          </Link>
          <ul className="hidden md:flex items-center" style={{ gap: 4 }}>
            {[{ to: '/', label: '首页' }, { to: '/articles', label: '文章' }, { to: '/about', label: '关于' }].map(item => (
              <li key={item.to}><Link to={item.to} style={{ display: 'block', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'var(--c-text-muted)', transition: 'all 0.25s' }}>{item.label}</Link></li>
            ))}
          </ul>
        </nav>
      </header>

      <main style={{ paddingTop: 100 }}>
        <article className="mx-auto" style={{ maxWidth: 800, padding: '0 24px' }}>
          <div style={{ marginBottom: 32 }}>
            <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 16 }}>
              <span style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--c-accent)', color: '#fff', fontSize: 12, fontWeight: 600 }}>{article.category}</span>
              {article.tags?.map((tag: string) => (
                <span key={tag} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--c-surface)', border: '1px solid var(--c-border)', fontSize: 12, color: 'var(--c-text-muted)' }}>{tag}</span>
              ))}
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, lineHeight: 1.2, color: 'var(--c-text-heading)', marginBottom: 16, letterSpacing: '-0.02em' }}>{article.title}</h1>
            <div className="flex flex-wrap items-center" style={{ gap: 16, fontSize: 14, color: 'var(--c-text-muted)' }}>
              <span>{article.createdAt}</span>
              <span>·</span>
              <span>{calcReadTime(article.content)} 分钟阅读</span>
            </div>
          </div>

          {article.coverImage && (
            <div style={{ marginBottom: 40, borderRadius: 16, overflow: 'hidden' }}>
              <LazyImage src={article.coverImage} alt={article.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          )}

          <div className="article-content" dangerouslySetInnerHTML={{ __html: mdLoading ? "" : renderedContent }} style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--c-text)' }} />

          <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--c-border)', marginBottom: 48 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-heading)', marginBottom: 16 }}>分享这篇文章</h3>
            <div className="flex flex-wrap" style={{ gap: 10 }}>
              <button onClick={copyLink} className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: copied ? 'var(--c-accent)' : 'var(--c-surface)', border: copied ? 'none' : '1px solid var(--c-border)', color: copied ? '#fff' : 'var(--c-text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(12px)', transition: 'all 0.25s' }}>
                {copied ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                )}
                {copied ? '已复制' : '复制链接'}
              </button>
              <button onClick={shareToTwitter} className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(12px)', transition: 'all 0.25s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                Twitter
              </button>
              <button onClick={shareToWeibo} className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(12px)', transition: 'all 0.25s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.098 20c-4.915 0-8.91-2.039-8.91-4.558 0-1.236.973-2.63 2.61-3.688 2.186-1.397 4.722-1.57 5.57-.384.355.496.39 1.16.142 1.965-.093.302.256.142.256.142 1.702-.765 3.098-.658 3.56.262.24.475.24 1.068-.01 1.738-.096.256.04.35.202.29 1.206-.45 2.264-.29 2.702.423.453.735.14 1.905-.858 2.953-1.475 1.554-4.968 1.307-5.766-.445 0 0-.182-.612-.288-.642-.106-.03-.202.193-.202.193-.355 1.247-2.678 2.132-4.964 1.748zM7.61 18.272c-2.262.52-4.208-.516-4.35-2.317-.142-1.8 1.553-3.48 3.815-3.997 2.262-.52 4.208.516 4.35 2.317.142 1.8-1.553 3.48-3.815 3.997zm-1.33-4.17c-.664.425-.188 1.375.99 2.052 1.21.697 2.56.585 3.024-.252.464-.837-.132-1.97-1.327-2.536-1.164-.55-2.023-.69-2.687-.264zm3.372 1.39c-.252.378-.78.202-1.18-.39-.4-.59-.47-1.318-.218-1.696.252-.378.78-.202 1.18.39.4.59.47 1.318.218 1.696zM9.2 14.12c-.072-.12-.238-.17-.372-.11-.134.06-.194.22-.13.35.06.13.23.18.36.12.14-.06.21-.23.14-.36zM10.02 13.46c-.18.27-.56.37-.84.22-.28-.15-.37-.47-.2-.74.18-.27.56-.37.84-.22.28.15.38.47.2.74zM15.68 4.14c-.97-.22-1.64.1-1.99.81-.17.34-.19.7-.08 1.04.06.19.02.32-.12.41-.15.1-.31.07-.46-.05-.61-.48-1.43-.6-2.22-.32-.41.14-.72.41-.9.76-.09.17-.16.36-.2.55-.06.29-.27.45-.55.45H9c-.28 0-.51-.22-.52-.5-.01-.3.02-.61.09-.91.21-.9.88-1.58 1.82-1.92 1.25-.45 2.64-.14 3.63.71.44.38.77.85.98 1.37.12.3.22.61.28.94.06.28-.12.55-.4.61-.29.06-.55-.12-.61-.4-.05-.26-.12-.51-.23-.75z" /></svg>
                微博
              </button>
            </div>
          </div>

          <Link to="/articles" className="inline-flex items-center" style={{ gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--c-text-muted)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回文章列表
          </Link>
        </article>
      </main>

      <footer style={{ borderTop: '1px solid var(--c-border)' }}>
        <div className="mx-auto" style={{ maxWidth: 1200, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>© {new Date().getFullYear()} {getSiteName(config)}. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  )
}

export default ArticleDetailPage

