import React from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ padding: 24 }}>
      <SEO title="页面未找到" description="您访问的页面不存在。" />
      <div style={{ textAlign: 'center' }}>
        {/* Big 404 number */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 'clamp(8rem, 20vw, 14rem)',
              fontWeight: 900,
              lineHeight: 0.85,
              letterSpacing: '-0.06em',
              color: 'transparent',
              WebkitTextStroke: '1px var(--c-border-strong)',
              userSelect: 'none',
            }}
          >
            404
          </h1>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12, color: 'var(--c-text-heading)' }}>
          页面未找到
        </h2>
        <p style={{ fontSize: 16, color: 'var(--c-text-muted)', maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.7 }}>
          抱歉，您访问的页面不存在或已被移除。
        </p>

        <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 32px',
              borderRadius: 10,
              background: 'var(--c-accent)',
              color: 'var(--c-bg)',
              fontWeight: 600,
              fontSize: 15,
              transition: 'all 0.3s var(--ease-out-expo)',
              boxShadow: '0 4px 20px rgba(200,149,108,0.25)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(200,149,108,0.35)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(200,149,108,0.25)' }}
          >
            返回首页
          </Link>
          <Link
            to="/articles"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '14px 32px',
              borderRadius: 10,
              border: '1px solid var(--c-border-strong)',
              color: 'var(--c-text)',
              fontWeight: 500,
              fontSize: 15,
              transition: 'all 0.3s var(--ease-out-expo)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--c-accent-border)'; e.currentTarget.style.color = 'var(--c-text-heading)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border-strong)'; e.currentTarget.style.color = 'var(--c-text)' }}
          >
            查看文章
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage