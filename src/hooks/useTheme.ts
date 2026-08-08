import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'

export type Theme = 'light' | 'dark'

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const THEME_STORAGE_KEY = 'blog-theme'

export const getThemeStyles = (theme: Theme) => {
  if (theme === 'dark') {
    return {
      background: 'bg-gray-900',
      text: 'text-white',
      card: 'bg-gray-800',
      cardText: 'text-white',
      border: 'border-gray-700',
      input: 'bg-gray-700 text-white placeholder-gray-400',
      button: 'bg-gray-600 hover:bg-gray-500',
    }
  }
  
  return {
    background: 'bg-white',
    text: 'text-gray-800',
    card: 'bg-white',
    cardText: 'text-gray-800',
    border: 'border-gray-200',
    input: 'bg-white text-gray-800 placeholder-gray-400',
    button: 'bg-gray-200 hover:bg-gray-300',
  }
}