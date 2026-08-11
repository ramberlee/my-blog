import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { configApi, analyticsApi, articlesApi, type SiteConfig } from '../utils/api'
import { getSiteName, getLogoLetter } from '../hooks/useSiteConfig'
import LazyImage from '../components/LazyImage'

const skills = [
  { name: 'React', level: 90 },
  { name: 'TypeScript', level: 85 },
  { name: 'Node.js', level: 80 },
  { name: '设计', level: 75 },
  { name: 'Python', level: 70 },
  { name: '摄影', level: 65 },
]

const experiences = [
  { year: '2024 — 至今', title: '高级前端工程师', company: '某科技公司', description: '负责核心产品前端架构设计与开发，带领团队完成多个重要项目。' },
  { year: '2022 — 2024', title: '前端开发工程师', company: '某互联网公司', description: '参与多个 Web 应用的开发，积累了丰富的 React 和 TypeScript 经验。' },
  { year: '2020 — 2022', title: '初级开发者', company: '某创业公司', description: '从零开始学习前端开发，快速成长为团队核心成员。' },
]

const emailIcon = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const githubIcon = <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
const twitterIcon = <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>

function buildContacts(config: SiteConfig | null) {
  if (!config) return []
  const list = []
  if (config.author.email) list.push({ label: '邮箱', value: config.author.email, href: 'mailto:' + config.author.email, icon: emailIcon })
  if (config.author.social.github) list.push({ label: 'GitHub', value: config.author.social.github.replace('https://', ''), href: config.author.social.github, icon: githubIcon })
  if (config.author.social.twitter) list.push({ label: 'Twitter', value: '@' + config.author.social.twitter.split('/').pop(), href: config.author.social.twitter, icon: twitterIcon })
  return list
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }) },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    el.querySelectorAll('.reveal').forEach((c) => obs.observe(c))
    return () => obs.disconnect()
  }, [])
  return ref
}

const AboutPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [articleCount, setArticleCount] = useState(0)
  const [visitorCount, setVisitorCount] = useState(0)
  const [daysRunning, setDaysRunning] = useState(0)
  const sectionRef = useReveal()

  useEffect(() => {
    configApi.get().then(setConfig).catch(console.error)
    Promise.allSettled([articlesApi.list(), analyticsApi.get()]).then(([articlesRes, analyticsRes]) => {
      const articles = articlesRes.status === 'fulfilled' ? articlesRes.value : []
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null
      setArticleCount(articles.filter(a => a.status === 'published').length)
      if (analytics) setVisitorCount(analytics.totalVisitors)
      if (articles.length > 0) {
        const dates = articles.map(a => new Date(a.createdAt).getTime())
        const earliest = Math.min(...dates)
        setDaysRunning(Math.max(1, Math.floor((Date.now() - earliest) / (1000 * 60 * 60 * 24))))
      }
    })
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal observer for scroll animations
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      <SEO title="关于" description="了解更多关于我的故事、技能和工作经历。" />
      {/* Navigation */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{ padding: scrolled ? '10px 0' : '18px 0', background: scrolled ? 'var(--c-nav-bg)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid var(--c-border)' : '1px solid transparent' }}
      >
        <nav className="mx-auto flex items-center justify-between" style={{ maxWidth: 1200, padding: '0 24px' }}>
          <Link to="/" className="flex items-center gap-3" style={{ fontWeight: 700, fontSize: 18, color: 'var(--c-text-heading)' }}>
            <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--c-accent), #a07850)', fontSize: 14, fontWeight: 800, color: 'var(--c-bg)' }}>{getLogoLetter(config)}</span>
            <span className="hidden sm:inline" style={{ letterSpacing: '-0.02em' }}>{getSiteName(config)}</span>
          </Link>
          <ul className="hidden md:flex items-center" style={{ gap: 4 }}>
            {[{ to: '/', label: '首页' }, { to: '/articles', label: '文章' }, { to: '/about', label: '关于' }].map((item) => (
              <li key={item.to}>
                <Link to={item.to} style={{ display: 'block', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: item.to === '/about' ? 'var(--c-text-heading)' : 'var(--c-text-muted)', transition: 'color 0.25s' }}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li style={{ marginLeft: 8 }}>
              <Link to="/admin" style={{ display: 'block', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--c-accent)', color: 'var(--c-bg)' }}>后台</Link>
            </li>
          </ul>
          <div className="md:hidden">
            <Link to="/" style={{ color: 'var(--c-text-muted)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content" ref={sectionRef} style={{ paddingTop: 140, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div className="mx-auto" style={{ maxWidth: 1000 }}>
          {/* Split hero — avatar left, bio right */}
          <section className="reveal" style={{ marginBottom: 80 }}>
            <div className="md:flex" style={{ display: 'block', gap: 64, alignItems: 'center' }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0, marginBottom: 32 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 24,
                      overflow: 'hidden',
                      border: '2px solid var(--c-border)',
                    }}
                  >
                                        {config?.author?.avatar ? (
                      <LazyImage src={config.author.avatar} alt={config.author.name || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--c-accent-soft), var(--c-bg-elevated))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 72, fontWeight: 800, color: 'var(--c-accent)', lineHeight: 1 }}>{(config?.author?.name || 'R').charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#22c55e', border: '3px solid var(--c-bg)' }} />
                </div>
              </div>

              {/* Bio */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>About</p>
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>{config?.author?.name || 'Ramber'}</h1>
                <p style={{ fontSize: 16, color: 'var(--c-accent)', fontWeight: 500, marginBottom: 20 }}>{config?.author?.bio || '热爱技术和写作的开发者'}</p>
                <p style={{ fontSize: 15, color: 'var(--c-text-muted)', lineHeight: 1.8, marginBottom: 32, maxWidth: 500 }}>
                  {config?.siteDescription || '分享技术文章、生活随笔与创意作品。'}
                </p>

                {/* Stats inline */}
                <div className="flex flex-wrap" style={{ gap: 16 }}>
                  {[
                    { value: String(articleCount), label: '篇文章' },
                    { value: visitorCount.toLocaleString(), label: '位读者' },
                    { value: String(daysRunning), label: '天运营' },
                  ].map((s) => (
                    <div key={s.label} className="glass" style={{ borderRadius: 12, padding: '16px 24px', textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-text-heading)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="reveal" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 32 }}>技能特长</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {skills.map((skill) => (
                <div key={skill.name} className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text-heading)' }}>{skill.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--c-text-muted)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{skill.level}%</span>
                  </div>
                  <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--c-surface)', overflow: 'hidden' }}>
                    <div
                      className="fill-bar"
                      style={{
                        height: '100%',
                        borderRadius: 2,
                        background: 'linear-gradient(90deg, var(--c-accent), #d4a574)',
                        width: `${skill.level}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Experience timeline */}
          <section className="reveal" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 32 }}>工作经历</h2>
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: 'var(--c-border)' }} />
              
              {experiences.map((exp, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: i < experiences.length - 1 ? 40 : 0 }}>
                  {/* Dot */}
                  <div style={{ position: 'absolute', left: -32, top: 6, width: 15, height: 15, borderRadius: '50%', background: i === 0 ? 'var(--c-accent)' : 'var(--c-bg-elevated)', border: `2px solid ${i === 0 ? 'var(--c-accent)' : 'var(--c-border-strong)'}` }} />
                  
                  <div className="glass" style={{ borderRadius: 14, padding: '24px 28px' }}>
                    <div className="flex flex-wrap items-center justify-between" style={{ gap: 12, marginBottom: 8 }}>
                      <div>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text-heading)', marginBottom: 2 }}>{exp.title}</h3>
                        <p style={{ fontSize: 14, color: 'var(--c-accent)', fontWeight: 500 }}>{exp.company}</p>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--c-text-muted)', fontVariantNumeric: 'tabular-nums', fontWeight: 500, padding: '4px 12px', borderRadius: 6, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                        {exp.year}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.7 }}>{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="reveal">
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 32 }}>联系方式</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {buildContacts(config).map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="spotlight-card glass"
                  style={{ borderRadius: 14, padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-accent)', flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 500, marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-heading)' }}>{c.value}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
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

export default AboutPage
