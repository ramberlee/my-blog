import React, { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'
import type { Theme } from '../contexts/ThemeContext'
import { THEME_STORAGE_KEY } from '../hooks/useTheme'

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') return stored
    } catch (error) {
      console.error('Failed to load theme:', error)
    }
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = React.useContext(ThemeContext) || { theme: 'dark' as Theme, toggleTheme: () => {} }

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'light' ? '切换到深色主题' : '切换到浅色主题'}
      title={theme === 'light' ? '切换到深色主题' : '切换到浅色主题'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 8,
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        color: 'var(--c-text-muted)',
        cursor: 'pointer',
        transition: 'all 0.25s',
        padding: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--c-accent-border)'
        e.currentTarget.style.color = 'var(--c-accent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--c-border)'
        e.currentTarget.style.color = 'var(--c-text-muted)'
      }}
    >
      {theme === 'light' ? (
        /* Moon icon */
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        /* Sun icon */
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  )
}
