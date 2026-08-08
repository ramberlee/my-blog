import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ContentManager from '../components/ContentManager'
import { ToastProvider } from '../components/Toast'

const mockList = vi.fn()
vi.mock('../utils/api', () => ({
  articlesApi: {
    list: (...a: any[]) => mockList(...a),
    create: vi.fn(), update: vi.fn(), delete: vi.fn(), import: vi.fn(),
  },
}))

const articles = [
  { id: '1', title: 'AlphaArticle', content: '内容', category: 'Tech', tags: ['React'], createdAt: '2024-01-15', updatedAt: '2024-01-15', status: 'published' as const },
  { id: '2', title: 'BetaArticle', content: '内容', category: 'Life', tags: [], createdAt: '2024-01-10', updatedAt: '2024-01-10', status: 'draft' as const },
]

const wrap = () => render(<MemoryRouter><ToastProvider><ContentManager /></ToastProvider></MemoryRouter>)

describe('ContentManager', () => {
  beforeEach(() => { vi.clearAllMocks(); mockList.mockResolvedValue([...articles]) })
  afterEach(() => cleanup())

  it('loads articles from API', async () => {
    wrap()
    await waitFor(() => expect(screen.getByText('AlphaArticle')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByText('BetaArticle')).toBeInTheDocument()
  })

  it('shows count summary', async () => {
    wrap()
    await waitFor(() => expect(screen.getByText('AlphaArticle')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByText(/总计/)).toBeInTheDocument()
    expect(screen.getAllByText('已发布').length).toBeGreaterThanOrEqual(1)
  })

  it('filters by search', async () => {
    const user = userEvent.setup()
    wrap()
    await waitFor(() => expect(screen.getByText('AlphaArticle')).toBeInTheDocument(), { timeout: 5000 })
    await user.type(screen.getByPlaceholderText('搜索标题、内容、标签...'), 'Alpha')
    await waitFor(() => {
      expect(screen.getByText('AlphaArticle')).toBeInTheDocument()
      expect(screen.queryByText('BetaArticle')).not.toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('opens create form', async () => {
    const user = userEvent.setup()
    wrap()
    await waitFor(() => expect(screen.getByText('新建文章')).toBeInTheDocument(), { timeout: 5000 })
    await user.click(screen.getByText('新建文章'))
    expect(screen.getByPlaceholderText('文章标题...')).toBeInTheDocument()
  })

  it('validates title required on save', async () => {
    const user = userEvent.setup()
    wrap()
    await waitFor(() => expect(screen.getByText('新建文章')).toBeInTheDocument(), { timeout: 5000 })
    await user.click(screen.getByText('新建文章'))
    const saveBtns = screen.getAllByText('保存')
    await user.click(saveBtns[saveBtns.length - 1])
    await waitFor(() => expect(screen.getByText('标题不能为空')).toBeInTheDocument(), { timeout: 5000 })
  })

  it('shows empty state on no match', async () => {
    const user = userEvent.setup()
    wrap()
    await waitFor(() => expect(screen.getByText('AlphaArticle')).toBeInTheDocument(), { timeout: 5000 })
    await user.type(screen.getByPlaceholderText('搜索标题、内容、标签...'), 'zzzznothing')
    await waitFor(() => expect(screen.getByText('没有找到匹配的文章')).toBeInTheDocument(), { timeout: 5000 })
  })

  it('sorts by date', async () => {
    wrap()
    await waitFor(() => expect(screen.getByText('AlphaArticle')).toBeInTheDocument(), { timeout: 5000 })
    // AlphaArticle (2024-01-15) should appear before BetaArticle (2024-01-10)
    const all = screen.getAllByText(/Article/)
    const alphaIdx = all.findIndex(el => el.textContent === 'AlphaArticle')
    const betaIdx = all.findIndex(el => el.textContent === 'BetaArticle')
    expect(alphaIdx).toBeLessThan(betaIdx)
  })
})
