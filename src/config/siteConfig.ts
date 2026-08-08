// 网站配置文件
export interface SiteConfig {
  siteName: string
  siteDescription: string
  author: {
    name: string
    avatar: string
    bio: string
    email: string
    social: {
      github?: string
      twitter?: string
      weibo?: string
      email?: string
    }
  }
  theme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
  navigation: {
    label: string
    path: string
  }[]
  footer: {
    copyright: string
    links: {
      label: string
      url: string
    }[]
  }
}

// 默认配置
export const defaultConfig: SiteConfig = {
  siteName: '个人博客',
  siteDescription: '用色彩记录生活，用创意点亮世界',
  author: {
    name: '张三',
    avatar: '',
    bio: '一名热爱技术和写作的开发者',
    email: 'your@email.com',
    social: {
      github: 'https://github.com/yourusername',
      twitter: 'https://twitter.com/yourusername',
      weibo: 'https://weibo.com/yourusername',
      email: 'mailto:your@email.com',
    },
  },
  theme: {
    primaryColor: '#fbbf24', // yellow-400
    secondaryColor: '#ec4899', // pink-500
    accentColor: '#8b5cf6', // purple-500
  },
  navigation: [
    { label: '首页', path: '/' },
    { label: '文章', path: '/articles' },
    { label: '关于', path: '/about' },
  ],
  footer: {
    copyright: '© 2024 个人博客. 保留所有权利.',
    links: [
      { label: 'GitHub', url: 'https://github.com/yourusername' },
      { label: 'Twitter', url: 'https://twitter.com/yourusername' },
      { label: '邮箱', url: 'mailto:your@email.com' },
    ],
  },
}

// 配置存储键
const CONFIG_STORAGE_KEY = 'blog-config'

// 加载配置
export const loadConfig = (): SiteConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Failed to load config:', error)
  }
  return defaultConfig
}

// 保存配置
export const saveConfig = (config: SiteConfig): void => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save config:', error)
  }
}

// 重置配置
export const resetConfig = (): void => {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to reset config:', error)
  }
}