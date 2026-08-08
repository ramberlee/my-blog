import { useEffect, useCallback } from 'react'
import { useToast } from '../components/Toast'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  description: string
  handler: () => void
  skipInInput?: boolean
  enabled?: boolean
}

const isInputElement = (el: Element | null): boolean => {
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.getAttribute('contenteditable') === 'true') return true
  return false
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue

        const ctrlOrMeta = shortcut.ctrl || shortcut.meta
        const ctrlMatch = ctrlOrMeta ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey

        if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue
        if (!ctrlMatch) continue
        if (shortcut.shift !== undefined && !shiftMatch) continue

        if (shortcut.skipInInput !== false && isInputElement(e.target as Element)) continue

        e.preventDefault()
        e.stopPropagation()
        shortcut.handler()
        return
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function useAdminShortcuts(opts: {
  onSave?: () => void
  onEscape?: () => void
  onNewArticle?: () => void
  onFocusSearch?: () => void
  isEditing?: boolean
  activeTab?: string
}) {
  const { toast } = useToast()
  const { onSave, onEscape, onNewArticle, onFocusSearch, isEditing, activeTab } = opts

  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      meta: true,
      description: '保存',
      skipInInput: false,
      enabled: !!isEditing && !!onSave,
      handler: () => {
        onSave?.()
        toast('快捷键保存', 'info')
      },
    },
    {
      key: 'Escape',
      description: '关闭/取消',
      skipInInput: false,
      enabled: !!onEscape,
      handler: () => {
        onEscape?.()
      },
    },
    {
      key: 'n',
      ctrl: true,
      description: '新建文章',
      enabled: activeTab === 'content' && !isEditing && !!onNewArticle,
      handler: () => {
        onNewArticle?.()
        toast('快捷键新建文章', 'info')
      },
    },
    {
      key: 'f',
      ctrl: true,
      description: '聚焦搜索',
      skipInInput: false,
      enabled: !!onFocusSearch,
      handler: () => {
        onFocusSearch?.()
        toast('快捷键搜索', 'info')
      },
    },
  ])
}

export type { ShortcutConfig }
