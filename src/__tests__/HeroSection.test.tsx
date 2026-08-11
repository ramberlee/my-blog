import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
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

const makeImages = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `hero-${i + 1}`,
    url: `https://example.com/photo-${i + 1}.jpg`,
    alt: `Photo ${i + 1}`,
  }))

async function renderHero(heroImages: typeof baseConfig.heroImages) {
  mockGet.mockResolvedValue({ ...baseConfig, heroImages })
  const { default: HeroSection } = await import('../components/home/HeroSection')
  render(<MemoryRouter><HeroSection /></MemoryRouter>)
  if (heroImages.length > 0) {
    await screen.findByAltText(heroImages[0].alt)
  } else {
    await act(async () => {})
  }
}

describe('HeroSection', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks() })
  afterEach(() => cleanup())

  it('renders configured photography images', async () => {
    await renderHero(makeImages(3))
    expect(screen.getAllByRole('img')).toHaveLength(3)
    expect(screen.getByAltText('Photo 1')).toHaveAttribute('src', 'https://example.com/photo-1.jpg')
    expect(screen.getByAltText('Photo 2')).toHaveAttribute('src', 'https://example.com/photo-2.jpg')
    expect(screen.getByAltText('Photo 3')).toHaveAttribute('src', 'https://example.com/photo-3.jpg')
  })

  it('renders a single configured image on desktop and mobile layouts', async () => {
    await renderHero(makeImages(1))
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/photo-1.jpg')
    expect(images[0]).toHaveAttribute('alt', 'Photo 1')
  })

  it('renders five configured images in configuration order', async () => {
    await renderHero(makeImages(5))
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(5)
    images.forEach((image, i) => {
      expect(image).toHaveAttribute('src', `https://example.com/photo-${i + 1}.jpg`)
    })
  })

  it('renders no photo grid and no empty state when heroImages is empty', async () => {
    await renderHero([])
    expect(screen.queryByTestId('hero-photo-grid')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText(/暂无|还没有|整理中/)).not.toBeInTheDocument()
  })

  it('shows six images, expands to all twenty, and collapses again', async () => {
    const user = userEvent.setup()
    await renderHero(makeImages(20))

    expect(screen.getAllByRole('img')).toHaveLength(6)
    const expandButton = screen.getByRole('button', { name: '展开全部 20 张作品' })
    expect(expandButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(expandButton)
    expect(screen.getAllByRole('img')).toHaveLength(20)
    const collapseButton = screen.getByRole('button', { name: '收起全部' })
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(collapseButton)
    expect(screen.getAllByRole('img')).toHaveLength(6)
    expect(screen.getByRole('button', { name: '展开全部 20 张作品' })).toHaveAttribute('aria-expanded', 'false')
  })
})
