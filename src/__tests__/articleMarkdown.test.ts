import { describe, it, expect } from 'vitest'
import { articleToMarkdown, parseArticleMarkdown, slugify } from '../utils/articleMarkdown'
import type { Article } from '../utils/api'

const sample: Article = {
  id: '1',
  title: 'React 19 新特性解析',
  content: '# 标题\n\n正文内容\n\n- 列表项',
  category: '前端',
  tags: ['React', 'TypeScript'],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
  status: 'published',
  coverImage: 'https://example.com/cover.jpg',
}

describe('articleMarkdown', () => {
  it('round-trips an article through Markdown', () => {
    const md = articleToMarkdown(sample)
    const parsed = parseArticleMarkdown(md)
    expect(parsed).not.toBeNull()
    expect(parsed?.title).toBe(sample.title)
    expect(parsed?.category).toBe(sample.category)
    expect(parsed?.tags).toEqual(sample.tags)
    expect(parsed?.status).toBe('published')
    expect(parsed?.coverImage).toBe(sample.coverImage)
    expect(parsed?.createdAt).toBe(sample.createdAt)
    expect(parsed?.updatedAt).toBe(sample.updatedAt)
    expect(parsed?.content).toBe(sample.content)
  })

  it('parses comma-separated tags as fallback', () => {
    const md = `---
title: "测试"
tags: React, Vue
status: draft
---
正文`
    const parsed = parseArticleMarkdown(md)
    expect(parsed?.tags).toEqual(['React', 'Vue'])
    expect(parsed?.status).toBe('draft')
    expect(parsed?.coverImage).toBeUndefined()
  })

  it('returns null for invalid markdown without front matter', () => {
    expect(parseArticleMarkdown('# 没有 front matter')).toBeNull()
    expect(parseArticleMarkdown('')).toBeNull()
  })

  it('returns null when title is missing', () => {
    const md = `---
category: 测试
---
正文`
    expect(parseArticleMarkdown(md)).toBeNull()
  })

  it('slugifies titles to safe filenames', () => {
    expect(slugify('React 19 新特性解析')).toBe('React-19-新特性解析')
    expect(slugify('a/b\\c:d*e?f"g<h>i|j')).toBe('a-b-c-d-e-f-g-h-i-j')
    expect(slugify('///')).toBe('article')
  })
})
