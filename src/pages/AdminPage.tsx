import React, { useState, useEffect } from 'react'
import { useSiteConfig, getSiteName, getLogoLetter } from '../hooks/useSiteConfig'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { ErrorBoundary } from '../components/ErrorBoundary'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import ContentManager from '../components/ContentManager'
import { useAdminShortcuts } from '../hooks/useKeyboardShortcuts'
import ConfigManager from '../components/ConfigManager'

type Tab = 'analytics' | 'content' | 'config'

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'analytics',
    label: '数据统计',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'content',
    label: '内容管理',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'config',
    label: '网站配置',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const AdminPage: React.FC = () => {
  const config = useSiteConfig()
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('content')
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  /* Keyboard shortcuts at admin level */
  useAdminShortcuts({ activeTab, isEditing: false })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    toast('已退出登录', 'info')
    navigate('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          padding: scrolled ? '10px 0' : '18px 0',
          background: scrolled ? 'var(--c-nav-bg)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--c-border)' : '1px solid transparent',
        }}
      >
        <nav className="mx-auto flex items-center justify-between" style={{ maxWidth: 1200, padding: '0 24px' }}>
          <div className="flex items-center" style={{ gap: 16 }}>
            <Link
              to="/"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--c-text-muted)', transition: 'color 0.25s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-text-muted)')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回首页
            </Link>
            <div style={{ width: 1, height: 20, background: 'var(--c-border)' }} />
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text-heading)', letterSpacing: '-0.02em' }}>后台管理</h1>
          </div>

          <div className="flex items-center" style={{ gap: 12 }}>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)' }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出
            </button>
            <Link to="/" style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-text-heading)' }}>
              <span className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, var(--c-accent), #a07850)', fontSize: 12, fontWeight: 800, color: '#fff' }}>{getLogoLetter(config)}</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main id="main-content" style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          {/* Page header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Dashboard</p>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--c-text-heading)', marginBottom: 8 }}>管理中心</h1>
            <p style={{ fontSize: 15, color: 'var(--c-text-muted)' }}>管理文章内容、查看访问数据、配置网站信息。</p>
          </div>

          {/* Tab bar */}
          <div style={{ marginBottom: 40, borderBottom: '1px solid var(--c-border)', display: 'flex', gap: 4 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: 14,
                    fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--c-accent)' : 'var(--c-text-muted)',
                    background: 'transparent', border: 'none',
                    borderBottom: '2px solid ' + (isActive ? 'var(--c-accent)' : 'transparent'),
                    cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.25s', marginBottom: -1,
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--c-text)' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--c-text-muted)' }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'analytics' && <ErrorBoundary><AnalyticsDashboard /></ErrorBoundary>}
          {activeTab === 'content' && <ErrorBoundary><ContentManager /></ErrorBoundary>}
          {activeTab === 'config' && <ErrorBoundary><ConfigManager /></ErrorBoundary>}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--c-border)' }}>
        <div className="mx-auto" style={{ maxWidth: 1200, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>© {new Date().getFullYear()} {getSiteName(config)} · 后台管理系统</p>
        </div>
      </footer>
    </div>
  )
}

export default AdminPage

