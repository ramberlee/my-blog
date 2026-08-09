import React, { useState, useEffect } from 'react'
import { useSiteConfig, getSiteName, getLogoLetter } from '../hooks/useSiteConfig'
import { Link, useParams } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { resolveAssetUrl } from '../utils/api'
import { articlesApi, type Article } from '../utils/api'
import LazyImage from '../components/LazyImage'
import { useRenderedMarkdown } from '../hooks/useRenderedMarkdown'
import { calcReadTime } from '../utils/readTime'
import ReadingProgress from '../components/ReadingProgress'
import QRCode from 'qrcode'

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const config = useSiteConfig()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [douyinCopied, setDouyinCopied] = useState(false)
  const [showWechatQr, setShowWechatQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
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

  const shareToWeibo = () => {
    if (!article) return
    window.open('https://service.weibo.com/share/share.php?title=' + encodeURIComponent(article.title) + '&url=' + encodeURIComponent(window.location.href), '_blank')
  }

  // 微信没有网页分享接口，用二维码扫码分享
  const openWechatQr = async () => {
    setShowWechatQr(true)
    if (!qrDataUrl) {
      try {
        setQrDataUrl(await QRCode.toDataURL(window.location.href, { width: 240, margin: 1 }))
      } catch { }
    }
  }

  // 抖音没有网页分享接口，复制链接去 App 内粘贴分享
  const shareToDouyin = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setDouyinCopied(true)
      setTimeout(() => setDouyinCopied(false), 2000)
    } catch { }
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
  const seoImage = resolveAssetUrl(article.coverImage)

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
              <button onClick={openWechatQr} className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(12px)', transition: 'all 0.25s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .718-.098 11.227 11.227 0 0 0 2.836.378c.24 0 .472-.018.707-.042-.353-2.005.1-4.09 1.498-5.664 1.313-1.48 3.157-2.297 5.08-2.38-.722-3.775-4.615-6.611-9.415-6.611zM5.572 6.288a1.148 1.148 0 1 1 0 2.296 1.148 1.148 0 0 1 0-2.296zm6.239 0a1.148 1.148 0 1 1 0 2.296 1.148 1.148 0 0 1 0-2.296z"/><path d="M24 14.574c0-3.476-3.593-6.296-8.021-6.296-4.428 0-8.021 2.82-8.021 6.296 0 3.477 3.593 6.297 8.021 6.297.792 0 1.553-.108 2.268-.293a.663.663 0 0 1 .549.069l1.573.887a.295.295 0 0 0 .4-.375l-.31-1.157a.437.437 0 0 1 .157-.484C22.786 18.401 24 16.611 24 14.574zm-10.607-.983a.929.929 0 1 1 0-1.857.929.929 0 0 1 0 1.857zm5.214 0a.929.929 0 1 1 0-1.857.929.929 0 0 1 0 1.857z"/></svg>
                微信
              </button>
              <button onClick={shareToDouyin} className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: douyinCopied ? 'var(--c-accent)' : 'var(--c-surface)', border: douyinCopied ? 'none' : '1px solid var(--c-border)', color: douyinCopied ? '#fff' : 'var(--c-text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(12px)', transition: 'all 0.25s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .595.047.88.14V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                {douyinCopied ? '已复制，去抖音粘贴' : '抖音'}
              </button>
              <button onClick={shareToWeibo} className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', backdropFilter: 'blur(12px)', transition: 'all 0.25s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.098 20c-4.915 0-8.91-2.039-8.91-4.558 0-1.236.973-2.63 2.61-3.688 2.186-1.397 4.722-1.57 5.57-.384.355.496.39 1.16.142 1.965-.093.302.256.142.256.142 1.702-.765 3.098-.658 3.56.262.24.475.24 1.068-.01 1.738-.096.256.04.35.202.29 1.206-.45 2.264-.29 2.702.423.453.735.14 1.905-.858 2.953-1.475 1.554-4.968 1.307-5.766-.445 0 0-.182-.612-.288-.642-.106-.03-.202.193-.202.193-.355 1.247-2.678 2.132-4.964 1.748zM7.61 18.272c-2.262.52-4.208-.516-4.35-2.317-.142-1.8 1.553-3.48 3.815-3.997 2.262-.52 4.208.516 4.35 2.317.142 1.8-1.553 3.48-3.815 3.997zm-1.33-4.17c-.664.425-.188 1.375.99 2.052 1.21.697 2.56.585 3.024-.252.464-.837-.132-1.97-1.327-2.536-1.164-.55-2.023-.69-2.687-.264zm3.372 1.39c-.252.378-.78.202-1.18-.39-.4-.59-.47-1.318-.218-1.696.252-.378.78-.202 1.18.39.4.59.47 1.318.218 1.696zM9.2 14.12c-.072-.12-.238-.17-.372-.11-.134.06-.194.22-.13.35.06.13.23.18.36.12.14-.06.21-.23.14-.36zM10.02 13.46c-.18.27-.56.37-.84.22-.28-.15-.37-.47-.2-.74.18-.27.56-.37.84-.22.28.15.38.47.2.74zM15.68 4.14c-.97-.22-1.64.1-1.99.81-.17.34-.19.7-.08 1.04.06.19.02.32-.12.41-.15.1-.31.07-.46-.05-.61-.48-1.43-.6-2.22-.32-.41.14-.72.41-.9.76-.09.17-.16.36-.2.55-.06.29-.27.45-.55.45H9c-.28 0-.51-.22-.52-.5-.01-.3.02-.61.09-.91.21-.9.88-1.58 1.82-1.92 1.25-.45 2.64-.14 3.63.71.44.38.77.85.98 1.37.12.3.22.61.28.94.06.28-.12.55-.4.61-.29.06-.55-.12-.61-.4-.05-.26-.12-.51-.23-.75z" /></svg>
                微博
              </button>
            </div>
          </div>

          {showWechatQr && (
            <div
              onClick={() => setShowWechatQr(false)}
              role="dialog"
              aria-modal="true"
              style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 24, cursor: 'pointer' }}
            >
              <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-surface)', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 320, width: '100%', border: '1px solid var(--c-border)', cursor: 'default' }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text-heading)', marginBottom: 8 }}>微信扫码分享</h4>
                <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 16 }}>长按识别二维码，或截图后使用微信扫一扫</p>
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="文章链接二维码" style={{ width: 220, height: 220, borderRadius: 8, margin: '0 auto 16px', display: 'block' }} />
                  : <div style={{ width: 220, height: 220, margin: '0 auto 16px', borderRadius: 8, background: 'var(--c-bg)' }} />}
                <button onClick={() => setShowWechatQr(false)} style={{ padding: '8px 24px', borderRadius: 8, background: 'var(--c-accent)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>关闭</button>
              </div>
            </div>
          )}

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

