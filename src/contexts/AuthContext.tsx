import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../utils/api'

interface AuthContextType {
  isAuth: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

const TOKEN_KEY = 'blog-auth-token'
const EXPIRY_KEY = 'blog-auth-expiry'

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const expiry = localStorage.getItem(EXPIRY_KEY)
    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
      authApi.verify(token).then(({ valid }) => {
        setIsAuth(valid)
        if (!valid) { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EXPIRY_KEY) }
      }).catch(() => setIsAuth(false)).finally(() => setLoading(false))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(EXPIRY_KEY)
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (password: string) => {
    try {
      const { token, expiry } = await authApi.login(password)
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(EXPIRY_KEY, expiry.toString())
      setIsAuth(true)
      return true
    } catch { return false }
  }, [])

  const logout = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) authApi.logout(token).catch(() => {})
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRY_KEY)
setIsAuth(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
