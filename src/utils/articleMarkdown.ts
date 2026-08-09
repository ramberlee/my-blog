import type { Article } from './api'

/**
 * Serializes an article into a Markdown file with YAML front matter.
 *
 * The front matter preserves title, category, tags, status, cover image,
 * and timestamps so the file can be imported back losslessly.
 *
 * @param a - Article to serialize
 * @returns Markdown text (front matter + blank line + content)
 *
 * @example
 * ```ts
 * const md = articleToMarkdown(article)
 * ```
 */
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

/**
 * Parses a Markdown file (YAML front matter + body) into an article.
 *
 * Tags accept both JSON array (`["a", "b"]`) and comma-separated (`a, b`)
 * syntax. Missing optional fields fall back to sensible defaults.
 *
 * @param text - Markdown file content
 * @returns Parsed article, or null when the file is not in the expected format
 *
 * @example
 * ```ts
 * const article = parseArticleMarkdown(md)
 * ```
 */
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

/**
 * Converts an article title into a filesystem-safe filename.
 *
 * @param title - Article title
 * @returns Slug suitable for a `.md` filename, never empty
 *
 * @example
 * ```ts
 * const name = slugify('React 19 新特性解析') // 'React-19-新特性解析'
 * ```
 */
export function slugify(title: string): string {
  return title.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'article'
}
