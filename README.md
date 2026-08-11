# Ramber's Blog

[![React](https://img.shields.io/badge/React-19.2.8-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2.0-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.3.3-38bdf8.svg)](https://tailwindcss.com/)
[![Hono](https://img.shields.io/badge/Hono-4.13-ff6b35.svg)](https://hono.dev/)

全栈个人博客系统。前端基于 React 19 + Vite + Tailwind CSS 4，后端使用 Hono 提供 RESTful API，数据使用 SQLite 持久化存储。

## 功能特性

### 前台
- 响应式设计 · 深色/浅色主题切换 · 文章列表与详情 · 关于页面 · 404 页面
- SEO 优化（react-helmet-async）· RSS 订阅 · Sitemap · 无障碍支持
- 图片懒加载 · 代码高亮（highlight.js）· 阅读进度条 · 社交分享

### 后台管理
- 数据统计仪表盘 · 文章 CRUD · Markdown 编辑器（工具栏 + 自动保存 + 字数统计）
- 文章导出/导入（Markdown 文件，含 YAML front matter）
- 网站配置管理 · 头像/图片上传 · 首页摄影作品配置（任意数量，Sharp 压缩）

### 系统功能
- SHA-256 认证 + Session · 速率限制 · CSRF 防护 · 输入验证
- 错误边界 · Toast 通知 · 错误日志 · 健康检查 · 环境变量配置
- 55+ 个自动化测试 · GitHub Actions CI/CD

## 技术栈

| 分类 | 技术 | 用途 |
|------|------|------|
| 前端框架 | React 19 | UI 框架 |
| 类型系统 | TypeScript 6.0 | 类型安全 |
| 构建工具 | Vite 8.2 | 开发 + 生产构建 |
| CSS | Tailwind CSS 4.3 | 原子化样式 |
| 路由 | React Router 7 | SPA 路由 |
| 后端 | Hono 4.13 | REST API |
| 数据库 | better-sqlite3 | SQLite 存储 |
| Markdown | marked + DOMPurify | 解析 + XSS 防护 |
| 代码高亮 | highlight.js | 语法高亮 |
| 图片处理 | Sharp | 上传压缩 |
| 二维码 | qrcode | 微信分享二维码生成 |
| SEO | react-helmet-async | 动态 meta |
| 测试 | Vitest + RTL | 前后端测试 |

## 快速开始

```bash
# 环境要求: Node.js >= 18
npm install

# 同时启动前端和后端
npm run dev:full

# 或分别启动
npm run server   # 后端 :3001
npm run dev      # 前端 :5173

# 生产构建
npm run build
npm run server

# 运行测试
npm run test
```

默认登录地址 `/login`，密码 `admin123`（首次初始化时可用环境变量 `ADMIN_DEFAULT_PASSWORD` 覆盖）。

## API 端点

### 文章
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/articles | 获取文章列表 |
| GET | /api/articles/:id | 获取单篇文章 |
| POST | /api/articles | 创建文章 |
| PUT | /api/articles/:id | 更新文章 |
| DELETE | /api/articles/:id | 删除文章 |
| POST | /api/articles/import | 批量导入 |

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/verify | 验证 token |
| POST | /api/auth/logout | 退出 |
| POST | /api/auth/change-password | 修改密码 |

### 配置
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/config | 获取配置（含 heroImages 任意数量摄影作品） |
| PUT | /api/config | 更新配置（可提交任意数量 heroImages: [{ id, url, alt }]，支持空数组） |
| POST | /api/config/reset | 重置配置 |

`heroImages` 支持任意数量的摄影作品，可为空数组；首页 Hero 网格会按配置数量展示，超过 8 张时折叠并可通过展开按钮查看全部。

```json
PUT /api/config
{
  "heroImages": [
    { "id": "hero-1", "url": "/uploads/hero-1.jpg", "alt": "城市街拍" }
  ]
}
```

### 其他
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/analytics | 统计数据（PV/UV/每日趋势/热门文章/来源渠道） |
| POST | /api/analytics/track | 记录访问（visitorId 去重 UV；文章页单独累计 topArticles） |
| POST | /api/upload/image | 图片上传 |
| GET | /api/rss | RSS Feed |
| GET | /api/sitemap | Sitemap |
| GET | /api/health | 健康检查 |

## 项目结构

```
my-blog/
├── server/                    # Hono 后端
│   ├── routes/                #   API 路由
│   │   ├── articles.ts        #     文章 CRUD
│   │   ├── auth.ts            #     认证
│   │   ├── config.ts          #     配置
│   │   ├── analytics.ts       #     统计
│   │   ├── upload.ts          #     图片上传
│   │   ├── rss.ts             #     RSS
│   │   └── sitemap.ts         #     Sitemap
│   ├── middleware/             #   中间件
│   │   └── csrf.ts            #     CSRF 防护
│   ├── __tests__/             #   后端测试
│   ├── uploads/               #   上传的图片
│   ├── data/                  #   SQLite 数据库 + JSON 备份
│   ├── index.ts               #   服务入口
│   ├── db.ts                  #   SQLite 数据库初始化
│   ├── logger.ts              #   错误日志
│   └── storage.ts             #   存储层 (SQLite)
├── src/                       # React 前端
│   ├── components/            #   组件
│   │   ├── home/              #     首页子组件
│   │   │   ├── HomeNav.tsx    #       导航
│   │   │   ├── HeroSection.tsx#       英雄区
│   │   │   ├── FeaturedArticles.tsx
│   │   │   ├── TagMarquee.tsx #       标签滚动
│   │   │   ├── StatsRow.tsx   #       统计行
│   │   │   └── HomeFooter.tsx #       页脚
│   │   ├── LazyImage.tsx      #     懒加载图片
│   │   ├── ReadingProgress.tsx#     阅读进度条
│   │   ├── MarkdownToolbar.tsx#     编辑器工具栏
│   │   ├── SEO.tsx            #     SEO meta
│   │   ├── ErrorBoundary.tsx  #     错误边界
│   │   ├── Toast.tsx          #     通知
│   │   ├── ThemeProvider.tsx   #     主题管理
│   │   ├── ProtectedRoute.tsx #     路由守卫
│   │   └── ...                #     管理组件
│   ├── pages/                 #   页面
│   ├── hooks/                 #   自定义 Hooks
│   ├── utils/                 #   工具函数
│   │   └── articleMarkdown.ts #     文章 Markdown 导出/导入格式
│   ├── contexts/              #   Context
│   ├── __tests__/             #   前端测试
│   └── config/                #   配置
│       └── heroImages.ts      #     首页摄影作品默认图
├── .github/workflows/ci.yml   # CI/CD
├── .env.example               # 环境变量模板
├── AGENTS.md                  # Agent 文档规范
└── index.html                 # HTML 入口
```

## 路由结构

| 路径 | 页面 | 权限 |
|------|------|------|
| / | 首页 | 公开 |
| /articles | 文章列表 | 公开 |
| /article/:id | 文章详情 | 公开 |
| /about | 关于 | 公开 |
| /login | 登录 | 公开 |
| /admin | 后台管理 | 需登录 |
| * | 404 | 公开 |

## 测试

```bash
npm run test        # 运行全部测试
npm run test:watch  # Watch 模式
```

覆盖范围：AuthContext · ContentManager · ConfigManager · HeroSection · ArticleMarkdown · Articles · Auth · Config · Analytics · RateLimit · RSS · Sitemap · Health

## 认证系统

- SHA-256 密码哈希 + 盐值
- 24 小时 Session Token
- 速率限制（5次/分钟/IP）
- CSRF 防护
- ProtectedRoute 路由守卫

## 部署

```bash
# Node.js 直接部署
npm run build
PORT=3001 npm run server

# 分离部署
# 前端 dist/ → Vercel / Netlify
# 后端 server/ → 独立 Node.js 服务
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3001 | 服务端口 |
| NODE_ENV | development | 运行环境 |
| SESSION_EXPIRY_HOURS | 24 | Session 有效期 |
| MAX_UPLOAD_SIZE_MB | 5 | 上传大小限制 |
| IMAGE_MAX_WIDTH | 1200 | 压缩最大宽度 |
| IMAGE_QUALITY | 80 | 压缩质量 |
| SITE_URL | http://localhost:3001 | 站点公开地址（sitemap / RSS 使用） |
| VITE_SITE_URL | - | 前端注入的站点地址（og:url / canonical） |
| ADMIN_DEFAULT_PASSWORD | admin123 | 首次初始化默认管理员密码 |
| VITE_API_BASE | /api | 前端 API 基地址（GitHub Pages 部署时为 ngrok 隧道地址） |

## 贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'feat: xxx'`)
4. 推送 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 许可证

MIT

## 致谢

[React](https://react.dev/) · [Vite](https://vitejs.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [Hono](https://hono.dev/) · [React Router](https://reactrouter.com/)
