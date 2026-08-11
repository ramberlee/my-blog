import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { DEFAULT_HERO_IMAGES } from '../../config/heroImages'
import LazyImage from '../LazyImage'

const HERO_COLLAPSED_COUNT = 6
const HERO_EXPAND_THRESHOLD = 8

const HeroSection: React.FC = () => {
  const config = useSiteConfig()
  const heroImages = config?.heroImages ?? DEFAULT_HERO_IMAGES
  const [expanded, setExpanded] = useState(false)

  const shouldCollapse = heroImages.length > HERO_EXPAND_THRESHOLD
  const visibleImages = shouldCollapse && !expanded ? heroImages.slice(0, HERO_COLLAPSED_COUNT) : heroImages

  return (
    <section
      aria-label="英雄区域"
      style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', padding: '120px 24px 80px' }}
    >
      <div className="mx-auto" style={{ maxWidth: 1200, width: '100%' }}>
        <div className="reveal" style={{ marginBottom: 20 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              background: 'var(--c-accent-soft)',
              border: '1px solid var(--c-accent-border)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--c-accent)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-accent)', animation: 'pulse-subtle 2s ease-in-out infinite' }}
            />
            个人创作空间
          </span>
        </div>

        <h1
          className="reveal"
          style={{
            fontSize: 'clamp(3rem, 8vw, 6.5rem)',
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            color: 'var(--c-text-heading)',
            marginBottom: 32,
            maxWidth: 900,
          }}
        >
          用创意
          <br />
          <span style={{ color: 'var(--c-accent)' }}>点亮世界</span>
        </h1>

        <p
          className="reveal"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            lineHeight: 1.7,
            color: 'var(--c-text-muted)',
            maxWidth: 520,
            marginBottom: 48,
          }}
        >
          在这里分享技术文章、生活随笔、创意作品和学习笔记。探索无限可能。
        </p>

        <div className="reveal flex flex-wrap" style={{ gap: 16, marginBottom: 80 }}>
          <Link
            to="/articles"
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(200,149,108,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(200,149,108,0.25)'
            }}
          >
            开始阅读
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            to="/about"
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
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--c-accent-border)'
              e.currentTarget.style.color = 'var(--c-text-heading)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--c-border-strong)'
              e.currentTarget.style.color = 'var(--c-text)'
            }}
          >
            了解更多
          </Link>
        </div>

        {/* Hero image grid — dynamic responsive photo gallery */}
        {heroImages.length > 0 && (
          <>
            <div
              data-testid="hero-photo-grid"
              className="reveal grid grid-cols-2 md:grid-cols-4"
              style={{ gap: 16, maxWidth: 900, marginBottom: shouldCollapse ? 16 : 0 }}
            >
              {visibleImages.map((image, index) => (
                <div
                  key={image.id}
                  className={!expanded && index === 0 ? 'col-span-2' : undefined}
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                    aspectRatio: expanded || index > 0 ? '4/3' : '16/10',
                  }}
                >
                  <LazyImage
                    src={image.url}
                    alt={image.alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    aria-hidden="true"
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--c-overlay-medium), transparent)' }}
                  />
                </div>
              ))}
            </div>
            {shouldCollapse && (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 16,
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--c-border-strong)',
                  background: 'var(--c-surface)',
                  color: 'var(--c-text)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.3s var(--ease-out-expo)',
                }}
              >
                {expanded ? '收起全部' : `展开全部 ${heroImages.length} 张作品`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default HeroSection
