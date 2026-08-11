import type { HeroImage } from '../utils/api'

/**
 * Default photography slots shown on the homepage before the site owner
 * replaces them in 网站设置.
 */
export const DEFAULT_HERO_IMAGES: HeroImage[] = [
  {
    id: 'hero-main',
    url: 'https://picsum.photos/seed/bloghero/800/500',
    alt: '城市街头摄影作品',
  },
  {
    id: 'hero-side-1',
    url: 'https://picsum.photos/seed/blogcode/400/300',
    alt: '自然光影摄影作品',
  },
  {
    id: 'hero-side-2',
    url: 'https://picsum.photos/seed/blognature/400/300',
    alt: '金色时刻摄影作品',
  },
]
