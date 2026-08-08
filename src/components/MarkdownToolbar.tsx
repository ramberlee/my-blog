import React, { type RefObject } from 'react'

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  setValue: (value: string) => void
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: 'var(--c-text-muted)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  transition: 'all 0.2s',
  padding: 0,
}

const iconSize = 16

const icons = {
  bold: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  italic: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  h2: null,
  h3: null,
  link: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  code: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  list: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
}

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ textareaRef, setValue }) => {
  const applyWrap = (before: string, after: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = ta.value
    const selected = text.slice(start, end)
    const newText = text.slice(0, start) + before + selected + after + text.slice(end)
    setValue(newText)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  const applyLinePrefix = (prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const text = ta.value
    const lineStart = text.lastIndexOf('\n', start - 1) + 1
    const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart)
    setValue(newText)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length)
    })
  }

  const insertTemplate = (template: string, cursorOffset: number) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const text = ta.value
    const newText = text.slice(0, start) + template + text.slice(start)
    setValue(newText)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + cursorOffset, start + cursorOffset)
    })
  }

  const buttons = [
    { icon: icons.bold, label: 'B', action: () => applyWrap('**', '**'), title: '加粗' },
    { icon: icons.italic, label: <em>I</em>, action: () => applyWrap('*', '*'), title: '斜体' },
    { icon: icons.h2, label: 'H2', action: () => applyLinePrefix('## '), title: '标题2' },
    { icon: icons.h3, label: 'H3', action: () => applyLinePrefix('### '), title: '标题3' },
    { icon: icons.link, label: null, action: () => insertTemplate('[文本](url)', 1), title: '链接' },
    { icon: icons.code, label: null, action: () => insertTemplate('\n`\n代码\n`\n', 5), title: '代码块' },
    { icon: icons.list, label: null, action: () => applyLinePrefix('- '), title: '列表' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: '6px 8px',
        borderRadius: 12,
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        backdropFilter: 'blur(12px)',
        marginBottom: 8,
      }}
    >
      {buttons.map((btn, i) => (
        <button
          key={i}
          type="button"
          title={btn.title}
          onClick={btn.action}
          style={btnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-accent-soft)'; e.currentTarget.style.color = 'var(--c-accent)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-muted)' }}
        >
          {btn.icon ?? btn.label}
        </button>
      ))}
    </div>
  )
}

export default MarkdownToolbar
