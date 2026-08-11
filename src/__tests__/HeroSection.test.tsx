import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HeroSection from '../components/home/HeroSection'

const mockGet = vi.fn()

vi.mock('../utils/api', () => ({
  configApi: {
    get: (...a: any[]) => mockGet(...a),
    update: vi.fn(),
    reset: vi.fn(),
  },
  resolveAssetUrl: (url: string) => url,
}))

const mockConfig = {
  siteName: 'PhotoBlog',
  siteDescription: 'Photography',
  author: { name: 'Tester', bio: '', email: 'test@example.com', social: {} },
  heroImages: [
    { id: 'hero-main', url: 'https://example.com/main.jpg', alt: 'Main photography' },
    { id: 'hero-side-1', url: 'https://example.com/side-1.jpg', alt: 'Side photography one' },
    { id: 'hero-side-2', url: 'https://example.com/side-2.jpg', alt: 'Side photography two' },
  ],
}

describe('HeroSection', () => {
  beforeEach(() => { vi.clearAllMocks(); mockGet.mockResolvedValue({ ...mockConfig }) })
  afterEach(() => cleanup())

  it('renders configured photography images', async () => {
    render(<MemoryRouter><HeroSection /></MemoryRouter>)
    const main = await screen.findByAltText('Main photography')
    expect(main).toHaveAttribute('src', 'https://example.com/main.jpg')
    expect(screen.getByAltText('Side photography one')).toHaveAttribute('src', 'https://example.com/side-1.jpg')
    expect(screen.getByAltText('Side photography two')).toHaveAttribute('src', 'https://example.com/side-2.jpg')
  })
})
