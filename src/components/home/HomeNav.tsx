import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ThemeProvider'
import { useSiteConfig, getLogoLetter, getSiteName } from '../../hooks/useSiteConfig'

const ASSISTANT_URL = import.meta.env.VITE_ASSISTANT_URL ?? 'http://127.0.0.1:3080'

const HomeNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const config = useSiteConfig()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        padding: scrolled ? '10px 0' : '18px 0',
        background: scrolled ? 'var(--c-nav-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--c-border)' : '1px solid transparent',
      }}
    >
      <nav
        role="navigation"
        aria-label="主导航"
        className="mx-auto flex items-center justify-between"
        style={{ maxWidth: 1200, padding: '0 24px' }}
      >
        <Link to="/" className="flex items-center gap-3" style={{ fontWeight: 700, fontSize: 18, color: 'var(--c-text-heading)' }}>
          <span
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--c-accent), #a07850)',
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--c-bg)',
            }}
          >
            {getLogoLetter(config)}
          </span>
          <span className="hidden sm:inline" style={{ letterSpacing: '-0.02em' }}>{getSiteName(config)}</span>
        </Link>

        <ul className="hidden md:flex items-center" style={{ gap: 4 }}>
          {[
            { to: '/', label: '首页' },
            { to: '/articles', label: '文章' },
            { to: '/about', label: '关于' },
          ].map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="relative"
                style={{
                  display: 'block',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: item.to === '/' ? 'var(--c-text-heading)' : 'var(--c-text-muted)',
                  transition: 'color 0.25s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-text-heading)')}
                onMouseLeave={(e) => {
                  if (item.to !== '/') e.currentTarget.style.color = 'var(--c-text-muted)'
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={ASSISTANT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--c-text-muted)',
                transition: 'color 0.25s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-text-heading)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-text-muted)')}
            >
              助理
            </a>
          </li>
          <li style={{ marginLeft: 8 }}>
            <Link
              to="/admin"
              style={{
                display: 'block',
                padding: '8px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                background: 'var(--c-accent)',
                color: 'var(--c-bg)',
                transition: 'opacity 0.25s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              后台
            </Link>
          </li>
          <li style={{ marginLeft: 12 }}>
            <ThemeToggle />
          </li>
        </ul>

        <div className="md:hidden flex items-center" style={{ gap: 12 }}>
          <ThemeToggle />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={isMenuOpen}
            style={{ color: 'var(--c-text-heading)', padding: 8 }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <nav className="md:hidden" style={{ padding: '12px 24px 16px' }} aria-label="移动端导航">
          <div className="glass" style={{ borderRadius: 12, padding: 16 }}>
            {[
              { to: '/', label: '首页' },
              { to: '/articles', label: '文章' },
              { to: '/about', label: '关于' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--c-text)',
                }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={ASSISTANT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--c-text)',
              }}
            >
              助理
            </a>
            <Link
              to="/admin"
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--c-text)',
              }}
            >
              后台管理
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

export default HomeNav