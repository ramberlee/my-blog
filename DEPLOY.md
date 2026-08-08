# 部署指南

## 快速部署（Windows 服务器）

### 1. 安装必要软件

`ash
# 安装 Node.js（如果没有）
winget install OpenJS.NodeJS.LTS

# 安装 PM2（进程管理器）
npm install -g pm2

# 安装 tsx（TypeScript 运行时）
npm install -g tsx
`

### 2. 克隆项目

`ash
git clone git@github.com:ramberlee/my-blog.git
cd my-blog
`

### 3. 安装依赖并构建

`ash
npm install
npm run build
`

### 4. 启动服务

`ash
# 使用 PM2 启动
pm2 start server/index.ts --name blog

# 保存 PM2 配置
pm2 save
pm2 startup
`

### 5. 访问博客

- 前台：http://your-server:3001
- 后台：http://your-server:3001/admin
- 默认密码：admin123

---

## 更新部署

`ash
# 拉取最新代码
git pull

# 重新构建
npm run build

# 重启服务
pm2 restart blog
`

---

## 环境变量

创建 .env 文件：

`env
NODE_ENV=production
PORT=3001
`
