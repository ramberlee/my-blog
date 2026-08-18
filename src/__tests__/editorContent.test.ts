import { describe, it, expect } from 'vitest'
import { isHtmlContent, toEditorHtml } from '../utils/editorContent'

describe('editorContent', () => {
  describe('isHtmlContent', () => {
    it('detects HTML content', () => {
      expect(isHtmlContent('<p>hello</p>')).toBe(true)
      expect(isHtmlContent('<h2>标题</h2><p>正文</p>')).toBe(true)
      expect(isHtmlContent('<!DOCTYPE html><html></html>')).toBe(true)
    })

    it('treats Markdown as non-HTML', () => {
      expect(isHtmlContent('# 标题')).toBe(false)
      expect(isHtmlContent('## 目录\n- 列表项')).toBe(false)
      expect(isHtmlContent('')).toBe(false)
    })
  })

  describe('toEditorHtml', () => {
    it('passes HTML through unchanged', () => {
      const html = '<p>hello <strong>world</strong></p>'
      expect(toEditorHtml(html)).toBe(html)
    })

    it('renders Markdown headings instead of leaking raw markdown', () => {
      const out = toEditorHtml('# RemoteDesk RustDesk 自建服务端部署教程')
      expect(out).toContain('<h1')
      expect(out).not.toContain('<p># RemoteDesk')
    })

    it('renders blockquotes, code blocks and lists from Markdown', () => {
      const md = [
        '> 这是一段引用',
        '',
        '## 目录',
        '',
        '- 步骤 1：准备服务器',
        '',
        '```bash',
        'docker compose up -d',
        '```',
      ].join('\n')
      const out = toEditorHtml(md)
      expect(out).toContain('<blockquote>')
      expect(out).toContain('<h2')
      expect(out).toContain('<ul>')
      expect(out).toContain('<pre><code')
      // raw markdown syntax must not leak as text
      expect(out).not.toContain('> 这是一段引用')
      expect(out).not.toContain('## 目录')
      expect(out).not.toContain('- 步骤 1')
    })

    it('keeps literal angle brackets inside inline code intact', () => {
      const out = toEditorHtml('将 `<IP>` 替换为服务器公网 IP')
      // marked escapes angle brackets inside inline code; the browser shows <IP>
      expect(out).toContain('&lt;IP&gt;')
    })

    it('returns empty string for empty input', () => {
      expect(toEditorHtml('')).toBe('')
      expect(toEditorHtml(null as unknown as string)).toBe('')
    })
  })
})