import React, { useState } from 'react'
import { useSiteConfig, getLogoLetter } from '../hooks/useSiteConfig'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

const LoginPage: React.FC = () => {
  const config = useSiteConfig()
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) { toast('请输入密码', 'error'); return }
    setIsSubmitting(true)
    const ok = await login(password)
    setIsSubmitting(false)
    if (ok) {
      toast('登录成功', 'success')
      navigate('/admin')
    } else {
      toast('密码错误', 'error')
    }
  }

  return (
    <>
      <Helmet>
        <title>登录 | 创意博客</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center" style={{ padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--c-accent), #a07850)', margin: '0 auto 20px' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{getLogoLetter(config)}</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-text-heading)', letterSpacing: '-0.03em', marginBottom: 6 }}>后台登录</h1>
            <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>输入管理员密码以继续</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            <div className="glass" style={{ borderRadius: 16, padding: 32 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 8 }}>密码</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入管理员密码..."
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 14px',
                      borderRadius: 10,
                      background: 'var(--c-surface)',
                      border: '1px solid var(--c-border)',
                      color: 'var(--c-text-heading)',
                      fontSize: 15,
                      outline: 'none',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color 0.25s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 6, background: 'transparent', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 10,
                  background: 'var(--c-accent)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'opacity 0.25s',
                }}
              >
                {isSubmitting ? '验证中...' : '登录'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-text-muted)', marginTop: 16 }}>
                默认密码：admin123
              </p>
            </div>
          </form>

          {/* Back to home */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link
              to="/"
              style={{ fontSize: 13, color: 'var(--c-text-muted)', transition: 'color 0.25s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-text-muted)')}
            >
              ← 返回首页
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginPage
