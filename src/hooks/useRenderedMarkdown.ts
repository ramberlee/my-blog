import { renderMarkdown } from '../utils/markdown'
import { isHtmlContent } from '../utils/editorContent'

/**
 * Hook that renders content to sanitized HTML.
 * Handles both HTML and Markdown content:
 * - If content starts with '<', it's treated as HTML and passed through directly
 * - Otherwise, it's rendered as Markdown
 *
 * @param content - Raw content string (HTML or Markdown)
 * @returns Object with html string and loading state
 */
export function useRenderedMarkdown(content: string | null | undefined): {
  html: string
  loading: boolean
} {
  if (!content) return { html: '', loading: false }

  if (isHtmlContent(content)) {
    // Content is already HTML - use directly
    return { html: content, loading: false }
  }

  // Content is Markdown - render it
  const html = renderMarkdown(content)
  return { html, loading: false }
}