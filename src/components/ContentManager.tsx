import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from './Toast'
import { articlesApi, analyticsApi, type Article } from '../utils/api'
import { useRenderedMarkdown } from '../hooks/useRenderedMarkdown'
import RichEditor from './RichEditor'

import { validateTitle, validateContent, validateTags } from '../utils/validation'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortableArticleItem from './SortableArticleItem'
import { useAdminShortcuts } from '../hooks/useKeyboardShortcuts'
import { articleToMarkdown, parseArticleMarkdown, slugify } from '../utils/articleMarkdown'

const DRAFT_KEY = 'blog-draft-autosave'
const ALL_TAGS = ['React','TypeScript','JavaScript','Node.js','前端','后端','CSS','Vue','Next.js','博客','生活','旅行','摄影','设计','新特性','计划','目标','新年','技巧','思考']
const ALL_CATEGORIES = ['技术','生活','旅行','读书','设计','随笔']

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text-heading)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.25s' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }


const ContentManager: React.FC = () => {
  const { toast } = useToast()
  const [articles, setArticles] = useState<Article[]>([])
  const [articleViews, setArticleViews] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '', category: '', tags: '', status: 'draft' as 'draft' | 'published', coverImage: '' })
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null)
  const [showMdPreview, setShowMdPreview] = useState(false)
  const [showTagSug, setShowTagSug] = useState(false)
  const [showCatSug, setShowCatSug] = useState(false)
  const tagRef = useRef<HTMLInputElement>(null)
  
  const searchRef = useRef<HTMLInputElement>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  
  const { html: previewHtml, loading: previewMdLoading } = useRenderedMarkdown(previewArticle?.content ?? null)

  /* --- Batch selection state --- */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  /* --- Batch operations --- */
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 篇文章吗？此操作不可撤销。`)) return
    try {
      await Promise.all(Array.from(selectedIds).map(id => articlesApi.delete(id)))
      toast(`已删除 ${selectedIds.size} 篇文章`, 'success')
      clearSelection()
      fetchArticles()
    } catch (e: any) {
      toast('批量删除失败: ' + e.message, 'error')
      fetchArticles()
    }
  }

  const handleBatchPublish = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`确定要发布选中的 ${selectedIds.size} 篇文章吗？`)) return
    try {
      await Promise.all(Array.from(selectedIds).map(id => articlesApi.update(id, { status: 'published' })))
      toast(`已发布 ${selectedIds.size} 篇文章`, 'success')
      clearSelection()
      fetchArticles()
    } catch (e: any) {
      toast('批量发布失败: ' + e.message, 'error')
      fetchArticles()
    }
  }

  const handleBatchUnpublish = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`确定要取消发布选中的 ${selectedIds.size} 篇文章吗？`)) return
    try {
      await Promise.all(Array.from(selectedIds).map(id => articlesApi.update(id, { status: 'draft' })))
      toast(`已取消发布 ${selectedIds.size} 篇文章`, 'success')
      clearSelection()
      fetchArticles()
    } catch (e: any) {
      toast('批量取消发布失败: ' + e.message, 'error')
      fetchArticles()
    }
  }

  /* Drag-and-drop sensors — pointer, touch, and keyboard */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  /** Whether drag-and-drop is active (disabled during search/filter) */
  const isDragEnabled = !searchQuery.trim() && filterStatus === 'all' && sortBy === 'date'

  /**
   * Handles drag end — reorders articles in state and persists to the API.
   * Only fires when drag-and-drop is enabled (no active search/filter).
   */
  const handleDragEnd = useCallback(async (event: import('@dnd-kit/core').DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setArticles(prev => {
      const oldIndex = prev.findIndex(a => a.id === active.id)
      const newIndex = prev.findIndex(a => a.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      const reordered = arrayMove(prev, oldIndex, newIndex)
      articlesApi.reorder(reordered.map(a => a.id)).catch(e => toast('排序保存失败: ' + e.message, 'error'))
      return reordered
    })
  }, [toast])

  /* Fetch articles from API */
  const fetchArticles = () => {
    Promise.all([articlesApi.list(), analyticsApi.get()])
      .then(([list, stats]) => {
        setArticles(list)
        const views: Record<string, number> = {}
        for (const item of stats.topArticles ?? []) views[item.id] = item.views
        setArticleViews(views)
      })
      .catch(e => toast('加载文章失败: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchArticles() }, [])

  /* Auto-save draft to localStorage with 5s debounce */
  useEffect(() => {
    if (!isEditing) return
    const timer = setTimeout(() => {
      try {
        const ts = new Date().toISOString()
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...editForm, savedAt: ts }))
        setDraftSavedAt(ts)
      } catch {}
    }, 5000)
    return () => clearTimeout(timer)
  }, [isEditing, editForm])

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY) } catch {} }

  const recoverDraft = (): boolean => {
    try {
      const d = localStorage.getItem(DRAFT_KEY)
      if (d) { const p = JSON.parse(d); if (p.title || p.content) { if (confirm('发现未保存的草稿，是否恢复？')) { setEditForm({ title: p.title || '', content: p.content || '', category: p.category || '', tags: p.tags || '', status: p.status || 'draft', coverImage: p.coverImage || '' }); return true } } }
    } catch {}
    return false
  }

  const handleCreate = () => {
    setCurrentArticle(null)
    if (!recoverDraft()) setEditForm({ title: '', content: '', category: '', tags: '', status: 'draft', coverImage: '' })
    setIsEditing(true)
  }

  const handleEdit = (article: Article) => {
    setCurrentArticle(article)
    setEditForm({ title: article.title, content: article.content, category: article.category, tags: article.tags.join(', '), status: article.status, coverImage: article.coverImage || '' })
    setIsEditing(true)
  }

  const handleSave = async () => {
    const titleErr = validateTitle(editForm.title)
    if (titleErr) { toast(titleErr, 'error'); return }
    const contentErr = validateContent(editForm.content)
    if (contentErr) { toast(contentErr, 'error'); return }
    const tagsErr = validateTags(editForm.tags)
    if (tagsErr) { toast(tagsErr, 'error'); return }
    const tagsArr = editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    try {
      if (currentArticle) {
        await articlesApi.update(currentArticle.id, { ...editForm, tags: tagsArr })
        toast('文章已更新', 'success')
      } else {
        await articlesApi.create({ ...editForm, tags: tagsArr })
        toast('文章已创建', 'success')
      }
      clearDraft(); setIsEditing(false); setCurrentArticle(null)
      fetchArticles()
    } catch (e: any) { toast('保存失败: ' + e.message, 'error') }
  }

  const handleDelete = async (id: string, title: string) => {
    if (confirm('确定要删除「' + title + '」吗？')) {
      try { await articlesApi.delete(id); toast('文章已删除', 'success'); fetchArticles() }
      catch (e: any) { toast('删除失败: ' + e.message, 'error') }
    }
  }

  const handleExport = async () => {
    for (const a of articles) {
      const blob = new Blob([articleToMarkdown(a)], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const el = document.createElement('a')
      el.href = url
      el.download = `${slugify(a.title)}.md`
      el.click()
      URL.revokeObjectURL(url)
      await new Promise(r => setTimeout(r, 200))
    }
    toast('已导出 ' + articles.length + ' 篇文章', 'success')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const imported: Article[] = []
    for (const file of files) {
      try {
        const parsed = parseArticleMarkdown(await file.text())
        if (parsed) imported.push(parsed)
      } catch { }
    }
    e.target.value = ''
    if (!imported.length) { toast('导入失败，请选择 .md 文件', 'error'); return }
    try {
      await articlesApi.import(imported)
      toast('已导入 ' + imported.length + ' 篇文章', 'success')
      fetchArticles()
    } catch (e: any) { toast('导入失败: ' + e.message, 'error') }
  }

  const addTag = (tag: string) => {
    const cur = editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    if (!cur.includes(tag)) setEditForm({ ...editForm, tags: [...cur, tag].join(', ') })
    setShowTagSug(false); tagRef.current?.focus()
  }

  const getTagSug = (): string[] => {
    const cur = editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : []
    const last = (cur[cur.length - 1] || '').toLowerCase()
    if (!last) return []
    return ALL_TAGS.filter(t => t.toLowerCase().includes(last) && !cur.includes(t)).slice(0, 5)
  }

  const getCatSug = (): string[] => {
    if (!editForm.category) return ALL_CATEGORIES.slice(0, 5)
    return ALL_CATEGORIES.filter(c => c.toLowerCase().includes(editForm.category.toLowerCase())).slice(0, 5)
  }

  const filtered = articles
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .filter(a => { if (!searchQuery.trim()) return true; const q = searchQuery.toLowerCase(); return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q)) || a.category.toLowerCase().includes(q) })
    .sort((a, b) => { if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); if (sortBy === 'title') return a.title.localeCompare(b.title); return a.status.localeCompare(b.status) })

  const pubCount = articles.filter(a => a.status === 'published').length
  const draftCount = articles.filter(a => a.status === 'draft').length

  /* Keyboard shortcuts */
  useAdminShortcuts({
    onNewArticle: handleCreate,
    onFocusSearch: () => searchRef.current?.focus(),
    onEscape: () => { if (isEditing) { clearDraft(); setIsEditing(false); setCurrentArticle(null) } },
  })

  if (loading) {
    return (
      <div className="glass" style={{ borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <div className="mx-auto mb-4 rounded-full animate-spin" style={{ width: 32, height: 32, border: '2px solid var(--c-border)', borderTopColor: 'var(--c-accent)' }} />
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>加载文章中...</p>
      </div>
    )
  }

  if (isEditing) {
    const tagSugs = getTagSug()
    const catSugs = getCatSug()
    return (
      <div className="glass" style={{ borderRadius: 16, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text-heading)' }}>{currentArticle ? '编辑文章' : '新建文章'}</h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--c-text-muted)', fontStyle: 'italic' }}>自动保存已开启</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>标题 *</label>
            <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} placeholder="文章标题..." onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>分类</label>
              <input type="text" value={editForm.category} onChange={e => { setEditForm({ ...editForm, category: e.target.value }); setShowCatSug(true) }} onFocus={() => setShowCatSug(true)} onBlur={() => setTimeout(() => setShowCatSug(false), 200)} style={inputStyle} placeholder="选择或输入分类..." />
              {showCatSug && catSugs.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, borderRadius: 10, background: 'var(--c-bg-elevated)', border: '1px solid var(--c-border-strong)', boxShadow: 'var(--shadow-md)', zIndex: 50, overflow: 'hidden' }}>
                  {catSugs.map(c => (<button key={c} onMouseDown={e => { e.preventDefault(); setEditForm({ ...editForm, category: c }); setShowCatSug(false) }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', fontSize: 14, color: 'var(--c-text)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-surface)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{c}</button>))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>标签（逗号分隔）</label>
              <input ref={tagRef} type="text" value={editForm.tags} onChange={e => { setEditForm({ ...editForm, tags: e.target.value }); setShowTagSug(true) }} onFocus={() => { if (getTagSug().length > 0) setShowTagSug(true) }} onBlur={() => setTimeout(() => setShowTagSug(false), 200)} style={inputStyle} placeholder="React, TypeScript, ..." />
              {showTagSug && tagSugs.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, borderRadius: 10, background: 'var(--c-bg-elevated)', border: '1px solid var(--c-border-strong)', boxShadow: 'var(--shadow-md)', zIndex: 50, overflow: 'hidden' }}>
                  {tagSugs.map(t => (<button key={t} onMouseDown={e => { e.preventDefault(); addTag(t) }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', fontSize: 14, color: 'var(--c-text)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-surface)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{t}</button>))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>封面图片 URL</label>
            <input type="text" value={editForm.coverImage} onChange={e => setEditForm({ ...editForm, coverImage: e.target.value })} style={inputStyle} placeholder="https://..." onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={labelStyle}>内容</label>
              <button onClick={() => setShowMdPreview(!showMdPreview)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', ...(showMdPreview ? { background: 'var(--c-accent)', color: '#fff', border: 'none' } : { background: 'var(--c-surface)', color: 'var(--c-text-muted)', border: '1px solid var(--c-border)' }) }}>{showMdPreview ? '返回编辑' : '预览'}</button>
            </div>
            {showMdPreview ? (
              <div style={{ ...inputStyle, minHeight: 280, lineHeight: 1.8, padding: '16px 20px' }} dangerouslySetInnerHTML={{ __html: editForm.content || '<p style="color: var(--c-text-muted)">暂无内容</p>' }} />
            ) : (
              <>
                <RichEditor
                  content={editForm.content}
                  onChange={(html) => setEditForm({ ...editForm, content: html })}
                  placeholder="开始写作..."
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 12, color: 'var(--c-text-muted)' }}>
                  <span>{draftSavedAt ? '草稿已自动保存' : ''}</span>
                  <span>{editForm.content.length} 字 · 约 {Math.max(1, Math.ceil(editForm.content.length / 400))} 分钟阅读</span>
                </div>
              </>
            )}
          </div>

          <div>
            <label style={labelStyle}>状态</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['draft', 'published'] as const).map(s => (
                <button key={s} onClick={() => setEditForm({ ...editForm, status: s })} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', border: 'none', ...(editForm.status === s ? { background: 'var(--c-accent)', color: '#fff' } : { background: 'var(--c-surface)', color: 'var(--c-text-muted)', border: '1px solid var(--c-border)' }) }}>{s === 'draft' ? '草稿' : '已发布'}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <button onClick={handleSave} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--c-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' }}>保存</button>
            <button onClick={() => { clearDraft(); setIsEditing(false); setCurrentArticle(null) }} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)' }}>取消</button>
          </div>
        </div>
      </div>
    )
  }

  if (previewArticle) {
    return (
      <div className="glass" style={{ borderRadius: 16, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--c-text-heading)', marginBottom: 8 }}>{previewArticle.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-border)', fontSize: 11, fontWeight: 600, color: 'var(--c-accent)' }}>{previewArticle.category || '未分类'}</span>
              <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{previewArticle.createdAt}</span>
              <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, ...(previewArticle.status === 'published' ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' } : { background: 'rgba(234,179,8,0.12)', color: '#facc15', border: '1px solid rgba(234,179,8,0.2)' }) }}>{previewArticle.status === 'published' ? '已发布' : '草稿'}</span>
            </div>
          </div>
          <button onClick={() => setPreviewArticle(null)} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)' }}>返回列表</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {previewArticle.tags.map(tag => (<span key={tag} style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--c-border)', fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 500 }}>{tag}</span>))}
        </div>
        <div className="prose" style={{ lineHeight: 1.8, fontSize: 15, color: 'var(--c-text)' }} dangerouslySetInnerHTML={{ __html: previewMdLoading ? '' : previewHtml }} />
      </div>
    )
  }

  return (
    <div className="glass" style={{ borderRadius: 16, padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text-heading)' }}>文章管理</h3>
            <p style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>总计 {articles.length} 篇文章 · {pubCount} 已发布 · {draftCount} 草稿</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleCreate} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--c-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            新建文章
          </button>
          <button onClick={handleExport} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)' }}>导出</button>
          <label style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center' }}>
            导入
            <input type="file" accept=".md" multiple onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-border)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--c-accent)', fontWeight: 600 }}>已选 {selectedIds.size} 篇</span>
          <button onClick={handleBatchPublish} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(34,197,94,0.2)', fontFamily: 'var(--font-body)' }}>批量发布</button>
          <button onClick={handleBatchUnpublish} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(234,179,8,0.15)', color: '#facc15', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(234,179,8,0.2)', fontFamily: 'var(--font-body)' }}>取消发布</button>
          <button onClick={handleBatchDelete} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'var(--font-body)' }}>批量删除</button>
          <button onClick={clearSelection} style={{ padding: '5px 12px', borderRadius: 6, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)' }}>取消选择</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索标题、内容、标签..." style={{ flex: 1, minWidth: 180, padding: '8px 14px', borderRadius: 8, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text-heading)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
        {[{ key: 'all' as const, label: '全部' }, { key: 'published' as const, label: '已发布' }, { key: 'draft' as const, label: '草稿' }].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)', ...(filterStatus === f.key ? { background: 'var(--c-accent)', color: '#fff' } : { background: 'var(--c-surface)', color: 'var(--c-text-muted)', border: '1px solid var(--c-border)' }) }}>{f.label}</button>
        ))}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'title' | 'status')} style={{ padding: '7px 12px', borderRadius: 8, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none' }}>
          <option value="date">按日期</option><option value="title">按标题</option><option value="status">按状态</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--c-text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ width: 14, height: 14, accentColor: 'var(--c-accent)', cursor: 'pointer' }} />
          全选
        </label>
      </div>

      {isDragEnabled ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(a => a.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(article => (
                <SortableArticleItem key={article.id} article={article} views={articleViews[article.id]} selected={selectedIds.has(article.id)} onToggleSelect={toggleSelect} onPreview={setPreviewArticle} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(article => (
            <SortableArticleItem key={article.id} article={article} views={articleViews[article.id]} selected={selectedIds.has(article.id)} onToggleSelect={toggleSelect} onPreview={setPreviewArticle} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <svg width="32" height="32" fill="none" stroke="var(--c-text-muted)" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.4 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>{searchQuery ? '没有找到匹配的文章' : '暂无文章'}</p>
        </div>
      )}
    </div>
  )
}

export default ContentManager




