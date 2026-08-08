import React from 'react'
import { Link } from 'react-router-dom'

const tags = ['React', 'TypeScript', '生活', '设计', '旅行', '摄影', '前端', 'Node.js', '读书', '思考']

const TagMarquee: React.FC = () => {
  return (
    <section
      aria-label="标签滚动条"
      style={{ padding: '40px 0', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)', overflow: 'hidden' }}
    >
      <div className="marquee-track" style={{ gap: 24 }} role="list">
        {[...tags, ...tags].map((tag, i) => (
          <Link
            key={`${tag}-${i}`}
            to={`/articles?tag=${tag}`}
            role="listitem"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 100,
              border: '1px solid var(--c-border)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--c-text-muted)',
              whiteSpace: 'nowrap',
              transition: 'all 0.25s',
              flexShrink: 0,
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
            <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--c-accent)', opacity: 0.6 }} />
            {tag}
          </Link>
        ))}
      </div>
    </section>
  )
}

export default TagMarquee
