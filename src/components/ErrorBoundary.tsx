import React from 'react'
import { Link } from 'react-router-dom'

interface Props { children: React.ReactNode; fallback?: React.ReactNode; onReset?: () => void }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />
    }
    return this.props.children
  }
}

/* ── Branded error fallback UI ── */
export const ErrorFallback: React.FC<{ error: Error | null; onReset: () => void }> = ({ error, onReset }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: 320 }}>
    <div style={{ textAlign: 'center', maxWidth: 420 }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <svg width="24" height="24" fill="none" stroke="#f87171" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text-heading)', marginBottom: 8 }}>出现了问题</h3>
      <p style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
        {error?.message || '组件渲染时发生未知错误'}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={onReset}
          style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--c-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' }}
        >
          重试
        </button>
        <Link
          to="/"
          style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 14, fontWeight: 500, border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
        >
          返回首页
        </Link>
      </div>
    </div>
  </div>
)
