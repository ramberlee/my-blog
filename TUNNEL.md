# 内网穿透配置指南

## 方案一：Cloudflare Tunnel（推荐）

### 1. 安装 cloudflared

`ash
# Windows
winget install cloudflare.cloudflared

# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
`

### 2. 登录 Cloudflare

`ash
cloudflared tunnel login
`

### 3. 创建隧道

`ash
cloudflared tunnel create my-blog
`

### 4. 配置隧道

创建 ~/.cloudflared/config.yml：

`yaml
tunnel: <tunnel-id>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
`

### 5. 添加 DNS 记录

`ash
cloudflared tunnel route dns my-blog api.yourdomain.com
`

### 6. 启动隧道

`ash
cloudflared tunnel run my-blog
`

### 7. 配置前端

在 .env 文件中设置：

`env
VITE_API_BASE=https://api.yourdomain.com/api
`

---

## 方案二：ngrok

### 1. 安装 ngrok

`ash
# Windows
winget install ngrok

# macOS
brew install ngrok

# Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok-v3-stable-linux-amd64.tgz | tar -xz
sudo mv ngrok /usr/local/bin
`

### 2. 配置 authtoken

`ash
ngrok config add-authtoken <your-token>
`

### 3. 启动隧道

`ash
ngrok http 3001
`

### 4. 配置前端

复制 ngrok 提供的 HTTPS URL，在 .env 文件中设置：

`env
VITE_API_BASE=https://xxxx.ngrok.io/api
`

---

## 方案三：frp

### 1. 服务端配置

在有公网 IP 的服务器上安装 frps：

`ash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.58.0/frp_0.58.0_linux_amd64.tar.gz
tar -xzf frp_0.58.0_linux_amd64.tar.gz
cd frp_0.58.0_linux_amd64
`

配置 rps.toml：

`	oml
bindPort = 7000
vhostHTTPPort = 8080
`

启动：

`ash
./frps -c frps.toml
`

### 2. 客户端配置

在本机安装 frpc：

`ash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.58.0/frp_0.58.0_windows_amd64.zip
`

配置 rpc.toml：

`	oml
serverAddr =  your-server-ip
serverPort = 7000

[[proxies]]
name = blog
type = http
localPort = 3001
customDomains = [yourdomain.com]
`

启动：

`ash
./frpc -c frpc.toml
`

### 3. 配置 Nginx

在服务器上配置 Nginx 反向代理：

`
ginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host System.Management.Automation.Internal.Host.InternalHost;
        proxy_set_header X-Real-IP ;
    }
}
`

---

## 更新前端配置

无论使用哪种方案，都需要更新前端配置：

`env
# .env
VITE_API_BASE=https://your-tunnel-url/api
`

然后重新构建：

`ash
npm run build
`
