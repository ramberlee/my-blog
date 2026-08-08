import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

// Mock the API module
vi.mock('../utils/api', () => ({
  authApi: {
    login: vi.fn(),
    verify: vi.fn(),
    logout: vi.fn(),
  },
  clearCsrfToken: vi.fn(),
}))

import { authApi } from '../utils/api'
const mockAuthApi = vi.mocked(authApi)

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('starts unauthenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuth).toBe(false)
    await vi.waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAuth).toBe(false)
  })

  it('restores session from localStorage', async () => {
    localStorage.setItem('blog-auth-token', 'test-token')
    localStorage.setItem('blog-auth-expiry', (Date.now() + 86400000).toString())
    mockAuthApi.verify.mockResolvedValue({ valid: true })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await vi.waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAuth).toBe(true)
    expect(mockAuthApi.verify).toHaveBeenCalledWith('test-token')
  })

  it('clears expired session', async () => {
    localStorage.setItem('blog-auth-token', 'expired-token')
    localStorage.setItem('blog-auth-expiry', (Date.now() - 1000).toString())

    const { result } = renderHook(() => useAuth(), { wrapper })
    await vi.waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAuth).toBe(false)
  })

  it('login succeeds with correct password', async () => {
    mockAuthApi.login.mockResolvedValue({ token: 'new-token', expiry: Date.now() + 86400000 })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await vi.waitFor(() => expect(result.current.loading).toBe(false))

    let success = false
    await act(async () => { success = await result.current.login('admin123') })
    expect(success).toBe(true)
    expect(result.current.isAuth).toBe(true)
  })

  it('login fails with wrong password', async () => {
    mockAuthApi.login.mockRejectedValue(new Error('密码错误'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await vi.waitFor(() => expect(result.current.loading).toBe(false))

    let success = true
    await act(async () => { success = await result.current.login('wrong') })
    expect(success).toBe(false)
    expect(result.current.isAuth).toBe(false)
  })

  it('logout clears session', async () => {
    // First login
    mockAuthApi.login.mockResolvedValue({ token: 'session-token', expiry: Date.now() + 86400000 })
    mockAuthApi.logout.mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await vi.waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.login('admin123') })
    expect(result.current.isAuth).toBe(true)

    act(() => { result.current.logout() })
    expect(result.current.isAuth).toBe(false)
    expect(mockAuthApi.logout).toHaveBeenCalled()
  })
})
