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

---

## 配置域名

### 1. 购买域名

在以下平台购买域名：
- 阿里云
- 腾讯云
- Cloudflare

### 2. 配置 DNS

在域名管理后台添加 A 记录：

| 主机记录 | 记录类型 | 记录值 | TTL |
|----------|----------|--------|-----|
| @ | A | 你的服务器 IP | 600 |
| www | A | 你的服务器 IP | 600 |

### 3. 安装 Nginx

`ash
sudo apt update
sudo apt install nginx -y
`

### 4. 配置 Nginx

创建配置文件：

`ash
sudo nano /etc/nginx/sites-available/blog
`

添加以下内容：

`
ginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade ;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host System.Management.Automation.Internal.Host.InternalHost;
        proxy_set_header X-Real-IP ;
        proxy_set_header X-Forwarded-For ;
        proxy_set_header X-Forwarded-Proto ;
    }
}
`

### 5. 启用配置

`ash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
`

### 6. 安装 SSL（Let's Encrypt）

`ash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot renew --dry-run
`

---

## 故障排查

`ash
# Node.js 日志
pm2 logs blog

# Nginx 日志
sudo tail -f /var/log/nginx/error.log
`
