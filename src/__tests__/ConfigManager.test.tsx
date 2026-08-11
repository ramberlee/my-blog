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
  resolveAssetUrl: (url: string) => url,
}))

const mockConfig = {
  siteName: 'TestBlog',
  siteDescription: 'A test blog',
  author: { name: 'TestAuthor', bio: 'Developer', email: 'test@example.com', social: { github: 'https://github.com/testuser', twitter: '', weibo: '' } },
  heroImages: [
    { id: 'hero-main', url: 'https://example.com/photo-1.jpg', alt: 'Main photo' },
    { id: 'hero-side-1', url: 'https://example.com/photo-2.jpg', alt: 'Side photo one' },
    { id: 'hero-side-2', url: 'https://example.com/photo-3.jpg', alt: 'Side photo two' },
  ],
}

const wrap = () => render(<MemoryRouter><ToastProvider><ConfigManager /></ToastProvider></MemoryRouter>)

const heroSection = () => screen.getByRole('heading', { name: '首页摄影作品' }).closest('div') as HTMLElement

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
    expect(screen.getByText('首页摄影作品')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com/photo-1.jpg')).toBeInTheDocument()
  })

  it('adds a new hero image entry with a stable id', async () => {
    const user = userEvent.setup()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('new-hero-id')
    wrap()
    await waitFor(() => expect(screen.getByText('编辑配置')).toBeInTheDocument(), { timeout: 5000 })
    await user.click(screen.getByText('编辑配置'))
    await user.click(screen.getByText('添加图片'))
    const urlInputs = heroSection().querySelectorAll('input[type="text"]')
    expect(urlInputs.length).toBe(8)
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })

  it('removes a hero image entry and saves the updated list', async () => {
    const user = userEvent.setup()
    mockUpdate.mockResolvedValue({ ...mockConfig })
    wrap()
    await waitFor(() => expect(screen.getByText('编辑配置')).toBeInTheDocument(), { timeout: 5000 })
    await user.click(screen.getByText('编辑配置'))
    const deleteButtons = heroSection().querySelectorAll('button[aria-label="删除图片"]')
    expect(deleteButtons.length).toBe(3)
    await user.click(deleteButtons[0])
    await user.click(screen.getByText('保存配置'))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1), { timeout: 5000 })
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      heroImages: mockConfig.heroImages.slice(1),
    }))
  })

  it('saves an empty hero image list', async () => {
    const user = userEvent.setup()
    mockUpdate.mockResolvedValue({ ...mockConfig, heroImages: [] })
    wrap()
    await waitFor(() => expect(screen.getByText('编辑配置')).toBeInTheDocument(), { timeout: 5000 })
    await user.click(screen.getByText('编辑配置'))
    for (let i = 0; i < mockConfig.heroImages.length; i++) {
      const deleteButton = heroSection().querySelector('button[aria-label="删除图片"]')!
      await user.click(deleteButton)
    }
    await user.click(screen.getByText('保存配置'))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1), { timeout: 5000 })
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ heroImages: [] }))
  })

  it('saves a newly added hero image entry', async () => {
    const user = userEvent.setup()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('new-hero-id')
    mockUpdate.mockResolvedValue({ ...mockConfig })
    wrap()
    await waitFor(() => expect(screen.getByText('编辑配置')).toBeInTheDocument(), { timeout: 5000 })
    await user.click(screen.getByText('编辑配置'))
    await user.click(screen.getByText('添加图片'))
    const urlInputs = heroSection().querySelectorAll<HTMLInputElement>('input[type="text"]')
    await user.type(urlInputs[6], 'https://example.com/photo-new.jpg')
    await user.type(urlInputs[7], 'New photo')
    await user.click(screen.getByText('保存配置'))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1), { timeout: 5000 })
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      heroImages: [
        ...mockConfig.heroImages,
        { id: 'new-hero-id', url: 'https://example.com/photo-new.jpg', alt: 'New photo' },
      ],
    }))
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
