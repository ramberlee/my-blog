import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const mockGet = vi.fn()

vi.mock('../utils/api', () => ({
  configApi: {
    get: (...a: any[]) => mockGet(...a),
    update: vi.fn(),
    reset: vi.fn(),
  },
  resolveAssetUrl: (url: string) => url,
}))

const baseConfig = {
  siteName: 'PhotoBlog',
  siteDescription: 'Photography',
  author: { name: 'Tester', bio: '', email: 'test@example.com', social: {} },
  heroImages: [] as Array<{ id: string; url: string; alt: string }>,
}

async function renderNav() {
  mockGet.mockResolvedValue(baseConfig)
  vi.stubEnv('VITE_ASSISTANT_URL', 'https://assistant.example.com')
  const { default: HomeNav } = await import('../components/home/HomeNav')
  render(<MemoryRouter><HomeNav /></MemoryRouter>)
  await screen.findByText('助理')
}

describe('HomeNav assistant link', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
  })

  it('renders the desktop assistant link with external target', async () => {
    await renderNav()
    const links = screen.getAllByRole('link', { name: '助理' })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', 'https://assistant.example.com')
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the assistant link in the mobile menu after opening it', async () => {
    await renderNav()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '打开菜单' }))

    const links = screen.getAllByRole('link', { name: '助理' })
    expect(links).toHaveLength(2)
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://assistant.example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('keeps the existing main navigation items', async () => {
    await renderNav()
    expect(screen.getByRole('link', { name: '首页' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '文章' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '关于' })).toBeInTheDocument()
  })
})
