import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ConfigManager from '../components/ConfigManager'
import { ToastProvider } from '../components/Toast'

const mockGet = vi.fn()
const mockUpdate = vi.fn()

vi.mock('../utils/api', () => ({
  configApi: {
    get: (...a: any[]) => mockGet(...a),
    update: (...a: any[]) => mockUpdate(...a),
    reset: vi.fn(),
  },
  authApi: { changePassword: vi.fn() },
}))

const mockConfig = {
  siteName: 'TestBlog',
  siteDescription: 'A test blog',
  author: { name: 'TestAuthor', bio: 'Developer', email: 'test@example.com', social: { github: 'https://github.com/testuser', twitter: '', weibo: '' } },
}

const wrap = () => render(<MemoryRouter><ToastProvider><ConfigManager /></ToastProvider></MemoryRouter>)

describe('ConfigManager', () => {
  beforeEach(() => { vi.clearAllMocks(); mockGet.mockResolvedValue({ ...mockConfig }) })
  afterEach(() => cleanup())

  it('loads and displays config', async () => {
    wrap()
    await waitFor(() => expect(screen.getByText('TestBlog')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByText('TestAuthor')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('shows GitHub link', async () => {
    wrap()
    await waitFor(() => expect(screen.getByText('网站配置')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getAllByText('https://github.com/testuser').length).toBeGreaterThanOrEqual(1)
  })

  it('enters edit mode', async () => {
    const user = userEvent.setup()
    wrap()
    await waitFor(() => expect(screen.getByText('编辑配置')).toBeInTheDocument(), { timeout: 5000 })
    await user.click(screen.getByText('编辑配置'))
    expect(screen.getByText('保存配置')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('saves config changes', async () => {
    const user = userEvent.setup()
    mockUpdate.mockResolvedValue({ ...mockConfig, siteName: 'NewName' })
    wrap()
    await waitFor(() => expect(screen.getByText('编辑配置')).toBeInTheDocument(), { timeout: 5000 })
    await user.click(screen.getByText('编辑配置'))
    const nameInput = screen.getByDisplayValue('TestBlog')
    await user.clear(nameInput)
    await user.type(nameInput, 'NewName')
    await user.click(screen.getByText('保存配置'))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled(), { timeout: 5000 })
  })

  it('shows password change section', async () => {
    const user = userEvent.setup()
    wrap()
    await waitFor(() => expect(screen.getAllByText('修改密码').length).toBeGreaterThanOrEqual(1), { timeout: 5000 })
    const pwBtns = screen.getAllByText('修改密码')
    const pwBtn = pwBtns.find(el => el.tagName === 'BUTTON')!
    await user.click(pwBtn)
    await waitFor(() => expect(screen.getByText('原密码')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByText('新密码（至少6位）')).toBeInTheDocument()
  })
})
