import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Article } from '../utils/api'

/** Props for a single sortable article row in the content manager list */
interface SortableArticleItemProps {
  article: Article
  selected: boolean
  onToggleSelect: (id: string) => void
  onPreview: (article: Article) => void
  onEdit: (article: Article) => void
  onDelete: (id: string, title: string) => void
}

/** Six-dot drag handle SVG icon */
const DragHandleIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.35 }}>
    <circle cx="5" cy="3" r="1.5" />
    <circle cx="11" cy="3" r="1.5" />
    <circle cx="5" cy="8" r="1.5" />
    <circle cx="11" cy="8" r="1.5" />
    <circle cx="5" cy="13" r="1.5" />
    <circle cx="11" cy="13" r="1.5" />
  </svg>
)

/**
 * A single article row with a drag handle for reordering.
 *
 * Uses @dnd-kit/sortable for accessible drag-and-drop with:
 * - Keyboard and touch support
 * - Semi-transparent preview while dragging
 * - Smooth CSS transition on drop
 */
const SortableArticleItem: React.FC<SortableArticleItemProps> = ({ article, selected, onToggleSelect, onPreview, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: article.id })

  const style: React.CSSProperties = {
    padding: '16px 20px',
    borderRadius: 12,
    background: selected ? 'var(--c-accent-soft)' : 'var(--c-surface)',
    border: '1px solid ' + (selected ? 'var(--c-accent-border)' : 'var(--c-border)'),
    transition: isDragging ? 'none' : 'all 0.25s',
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    touchAction: 'none',
  }

  return (
    <div ref={setNodeRef} style={style}
      onMouseEnter={e => { if (!isDragging && !selected) e.currentTarget.style.borderColor = 'var(--c-border-strong)' }}
      onMouseLeave={e => { if (!isDragging && !selected) e.currentTarget.style.borderColor = 'var(--c-border)' }}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="拖拽排序"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          marginTop: 2,
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          color: 'var(--c-text-muted)',
          borderRadius: 4,
          padding: 0,
        }}
      >
        <DragHandleIcon />
      </button>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(article.id)}
        style={{ width: 16, height: 16, accentColor: 'var(--c-accent)', cursor: 'pointer', marginTop: 3, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text-heading)' }}>{article.title}</h4>
              <span style={{
                padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                ...(article.status === 'published'
                  ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }
                  : { background: 'rgba(234,179,8,0.12)', color: '#facc15', border: '1px solid rgba(234,179,8,0.2)' })
              }}>{article.status === 'published' ? '已发布' : '草稿'}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>{article.category || '未分类'}</span><span>·</span><span>{article.createdAt}</span>
              {article.updatedAt !== article.createdAt && <><span>·</span><span>更新于 {article.updatedAt}</span></>}
            </div>
            <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.content}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {article.tags.map(tag => (<span key={tag} style={{ padding: '2px 8px', borderRadius: 5, background: 'var(--c-border)', fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>{tag}</span>))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {[{ label: '预览', fn: () => onPreview(article) }, { label: '编辑', fn: () => onEdit(article) }, { label: '删除', fn: () => onDelete(article.id, article.title) }].map(btn => (
              <button key={btn.label} onClick={btn.fn} style={{ padding: '6px 12px', borderRadius: 7, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)', transition: 'all 0.25s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = btn.label === '删除' ? 'rgba(239,68,68,0.3)' : 'var(--c-accent-border)'; e.currentTarget.style.color = btn.label === '删除' ? '#f87171' : 'var(--c-accent)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)' }}>{btn.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SortableArticleItem
