import type { Article } from './api'

/** 把文章序列化为 Markdown 文件（YAML front matter + 正文） */
export function articleToMarkdown(a: Article): string {
  const fm = [
    '---',
    `title: ${JSON.stringify(a.title)}`,
    `category: ${JSON.stringify(a.category || '')}`,
    `tags: ${JSON.stringify(a.tags || [])}`,
    `status: ${a.status}`,
    `coverImage: ${JSON.stringify(a.coverImage || '')}`,
    `createdAt: ${a.createdAt}`,
    `updatedAt: ${a.updatedAt}`,
    '---',
  ].join('\n')
  return fm + '\n\n' + (a.content || '') + '\n'
}

/** 解析 Markdown 文件（front matter + 正文）为文章；格式不正确时返回 null */
export function parseArticleMarkdown(text: string): Article | null {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return null
  const fields: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
  const str = (k: string, d = ''): string => {
    const v = fields[k]
    if (v === undefined || v === '') return d
    return v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
  }
  const title = str('title')
  if (!title) return null
  let tags: string[] = []
  const rawTags = fields.tags
  if (rawTags) {
    try {
      const arr = JSON.parse(rawTags)
      if (Array.isArray(arr)) tags = arr.map(String)
    } catch {
      tags = rawTags.split(',').map(t => t.trim()).filter(Boolean)
    }
  }
  const now = new Date().toISOString()
  return {
    id: title,
    title,
    category: str('category'),
    tags,
    status: str('status', 'draft') === 'published' ? 'published' : 'draft',
    coverImage: str('coverImage') || undefined,
    createdAt: str('createdAt', now),
    updatedAt: str('updatedAt', now),
    content: m[2].trim(),
  }
}

/** 标题转安全文件名 */
export function slugify(title: string): string {
  return title.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'article'
}
