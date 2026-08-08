import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuth, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="mx-auto mb-4 rounded-full animate-spin" style={{ width: 32, height: 32, border: '2px solid var(--c-border)', borderTopColor: 'var(--c-accent)' }} />
          <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>验证中...</p>
        </div>
      </div>
    )
  }

  if (!isAuth) return <Navigate to="/login" replace />

  return <>{children}</>
}

export default ProtectedRoute
