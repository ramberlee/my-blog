import { renderMarkdown } from './markdown'

/**
 * Detects whether the given content string is HTML or Markdown.
 * Returns true when the content appears to be HTML (starts with a tag).
 *
 * @param content - Raw article content string
 * @returns true when content looks like HTML
 *
 * @example
 * ```ts
 * isHtmlContent('<p>hello</p>') // true
 * isHtmlContent('# 标题') // false
 * ```
 */
export function isHtmlContent(content: string): boolean {
  const trimmed = content.trim()
  // Check if content starts with an HTML tag
  return /^<[a-zA-Z][\s\S]*>/.test(trimmed) || trimmed.startsWith('<!DOCTYPE')
}

/**
 * Normalizes raw article content for the rich-text editor (TipTap).
 * HTML content passes through unchanged; Markdown content is rendered
 * to HTML first so the editor never receives raw Markdown (which TipTap
 * would otherwise mangle into escaped plain text).
 *
 * @param content - Raw article content (HTML or Markdown)
 * @returns HTML string safe to load into the editor
 *
 * @example
 * ```ts
 * toEditorHtml('# 标题') // '<h1>标题</h1>'
 * toEditorHtml('<p>hi</p>') // '<p>hi</p>'
 * ```
 */
export function toEditorHtml(content: string): string {
  if (!content) return ''
  if (isHtmlContent(content)) return content
  return renderMarkdown(content)
}