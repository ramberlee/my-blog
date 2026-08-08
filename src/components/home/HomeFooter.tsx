import React from 'react'
import { Link } from 'react-router-dom'
import { useSiteConfig, getLogoLetter, getSiteName } from '../../hooks/useSiteConfig'

const githubIcon = <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
const weiboIcon = <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.443m8.672-8.006c-.18-.558-.878-.372-.878-.372s-.466.149-.75.225c-.285.075-.564-.093-.712-.093-.15 0-.397.093-.582.225-.186.131-.497.372-.497.372s-.652.558-1.07.803c-.42.244-.629.168-.832-.093-.203-.262-.372-.637-.372-.637s-.285-.558-.57-.712c-.285-.155-.57-.186-.855.093-.285.279-.466.558-.466.558s-.31.466-.57.652c-.262.186-.435.124-.57-.186-.136-.31-.186-.744-.186-.744s-.062-.558-.31-.803c-.249-.244-.57-.31-.855-.155-.285.155-.435.435-.435.435s-.285.558-.497.744c-.212.186-.372.155-.497-.093-.124-.249-.186-.558-.186-.558s-.093-.497-.31-.683c-.216-.186-.466-.155-.621.093-.155.249-.216.497-.216.497s-.155.558-.34.712c-.186.155-.341.093-.435-.155-.093-.249-.093-.527-.093-.527s-.031-.466-.216-.621c-.186-.155-.404-.124-.558.093-.155.216-.216.435-.216.435"/><path d="M17.66 7.522c.528-.335.896-.84.896-1.422 0-.94-.978-1.7-2.184-1.7-.48 0-.916.128-1.266.348-.318-.544-.912-.918-1.59-.918-1.004 0-1.818.816-1.818 1.822 0 .108.012.214.032.318-.396-.06-.762-.096-1.086-.096-3.12 0-5.648 2.178-5.648 4.86 0 2.684 2.528 4.862 5.648 4.862 3.118 0 5.646-2.178 5.646-4.862 0-.636-.136-1.246-.384-1.808z"/></svg>
const emailIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>

const HomeFooter: React.FC = () => {
  const config = useSiteConfig()

  const socialLinks = [
    config?.author?.social?.github ? { href: config.author.social.github, label: 'GitHub', icon: githubIcon } : null,
    config?.author?.social?.weibo ? { href: config.author.social.weibo, label: '微博', icon: weiboIcon } : null,
    config?.author?.email ? { href: `mailto:${config.author.email}`, label: 'Email', icon: emailIcon } : null,
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[]

  return (
    <footer role="contentinfo" style={{ borderTop: '1px solid var(--c-border)' }}>
      <div className="mx-auto" style={{ maxWidth: 1200, padding: '64px 24px 32px' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <Link to="/" className="flex items-center" style={{ gap: 10, fontWeight: 700, fontSize: 18, color: 'var(--c-text-heading)', marginBottom: 16 }}>
              <span className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, var(--c-accent), #a07850)', fontSize: 12, fontWeight: 800, color: 'var(--c-bg)' }}>
                {getLogoLetter(config)}
              </span>
              {getSiteName(config)}
            </Link>
            <p style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.7, maxWidth: 300 }}>
              {config?.siteDescription || '用文字记录成长，通过分享连接他人。'}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-heading)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>导航</h4>
            <nav aria-label="页脚导航">
              <ul style={{ listStyle: 'none' }}>
                {[{ to: '/', label: '首页' }, { to: '/articles', label: '文章' }, { to: '/about', label: '关于' }].map((item) => (
                  <li key={item.to} style={{ marginBottom: 12 }}>
                    <Link to={item.to} style={{ fontSize: 14, color: 'var(--c-text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-text-heading)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-muted)')}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-heading)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>社交</h4>
            <div style={{ display: 'flex', gap: 10 }}>
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target={s.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" aria-label={s.label}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid var(--c-border)', color: 'var(--c-text-muted)', transition: 'all 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-accent-border)'; e.currentTarget.style.color = 'var(--c-accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)' }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>© {new Date().getFullYear()} {getSiteName(config)}. 保留所有权利.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ fontSize: 13, color: 'var(--c-text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-text)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-muted)')}>隐私政策</a>
            <a href="#" style={{ fontSize: 13, color: 'var(--c-text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-text)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-muted)')}>使用条款</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default HomeFooter
