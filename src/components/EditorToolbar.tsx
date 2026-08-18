import React, { useCallback, useRef } from 'react'
import { uploadApi, resolveAssetUrl } from '../utils/api'
import { type Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
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

const activeStyle: React.CSSProperties = {
  ...btnStyle,
  background: 'var(--c-accent)',
  color: '#fff',
}

const disabledStyle: React.CSSProperties = {
  ...btnStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
}

const iconSize = 16

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('输入图片 URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const uploadImage = useCallback(async (file: File) => {
    if (!editor) return
    try {
      const res = await uploadApi.image(file)
      editor.chain().focus().setImage({ src: resolveAssetUrl(res.url) ?? res.url }).run()
    } catch (err: any) {
      window.alert('图片上传失败: ' + (err.message || '未知错误'))
    }
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('输入链接 URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const btn = (
    icon: React.ReactNode,
    title: string,
    action: () => void,
    isActive: boolean,
    isDisabled: boolean = false,
  ) => (
    <button
      type="button"
      title={title}
      onClick={action}
      disabled={isDisabled}
      style={isDisabled ? disabledStyle : isActive ? activeStyle : btnStyle}
      onMouseEnter={e => {
        if (!isDisabled && !isActive) {
          e.currentTarget.style.background = 'var(--c-surface)'
          e.currentTarget.style.color = 'var(--c-text-heading)'
        }
      }}
      onMouseLeave={e => {
        if (!isDisabled && !isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--c-text-muted)'
        }
      }}
    >
      {icon}
    </button>
  )

  if (!editor) return null

  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        padding: '6px 8px',
        borderRadius: 10,
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        backdropFilter: 'blur(12px)',
        marginBottom: 8,
      }}
    >
      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </svg>,
        '加粗',
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive('bold'),
      )}

      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4" />
          <line x1="14" y1="20" x2="5" y2="20" />
          <line x1="15" y1="4" x2="9" y2="20" />
        </svg>,
        '斜体',
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic'),
      )}

      <div style={{ width: 1, height: 20, background: 'var(--c-border)', margin: '0 4px', alignSelf: 'center' }} />

      {btn(
        <span style={{ fontSize: 14, fontWeight: 700 }}>H2</span>,
        '二级标题',
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive('heading', { level: 2 }),
      )}

      {btn(
        <span style={{ fontSize: 13, fontWeight: 700 }}>H3</span>,
        '三级标题',
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        editor.isActive('heading', { level: 3 }),
      )}

      <div style={{ width: 1, height: 20, background: 'var(--c-border)', margin: '0 4px', alignSelf: 'center' }} />

      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" />
          <circle cx="4" cy="12" r="1" fill="currentColor" />
          <circle cx="4" cy="18" r="1" fill="currentColor" />
        </svg>,
        '无序列表',
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList'),
      )}

      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <text x="4" y="8" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">1</text>
          <text x="4" y="14" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">2</text>
          <text x="4" y="20" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">3</text>
        </svg>,
        '有序列表',
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList'),
      )}

      <div style={{ width: 1, height: 20, background: 'var(--c-border)', margin: '0 4px', alignSelf: 'center' }} />

      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>,
        '行内代码',
        () => editor.chain().focus().toggleCode().run(),
        editor.isActive('code'),
      )}

      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <polyline points="9 8 5 12 9 16" />
          <polyline points="15 8 19 12 15 16" />
        </svg>,
        '代码块',
        () => editor.chain().focus().toggleCodeBlock().run(),
        editor.isActive('codeBlock'),
      )}

      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 17h3l2-4V7H5v6h3" />
          <path d="M15 17h3l2-4V7h-6v6h3" />
        </svg>,
        '引用',
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive('blockquote'),
      )}

      <div style={{ width: 1, height: 20, background: 'var(--c-border)', margin: '0 4px', alignSelf: 'center' }} />

      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>,
        '插入链接',
        setLink,
        editor.isActive('link'),
      )}

      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>,
        '插入图片',
        addImage,
        false,
      )}

      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>,
        '分割线',
        () => editor.chain().focus().setHorizontalRule().run(),
        false,
      )}
      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>,
        '上传图片',
        () => fileRef.current?.click(),
        false,
      )}
      {btn(
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="9" y1="4" x2="9" y2="20" />
          <line x1="15" y1="4" x2="15" y2="20" />
        </svg>,
        '插入表格',
        () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        editor.isActive('table'),
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (file) uploadImage(file)
      }} />
    </div>
  )
}

export default EditorToolbar
