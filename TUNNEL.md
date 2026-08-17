# 内网穿透配置指南

## 方案一：Cloudflare Tunnel（推荐）

### 1. 安装 cloudflared

```bash
# Windows
winget install cloudflare.cloudflared

# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

### 2. 登录 Cloudflare

```bash
cloudflared tunnel login
```

### 3. 创建隧道

```bash
cloudflared tunnel create my-blog
```

### 4. 配置隧道

创建 ~/.cloudflared/config.yml：

```yaml
tunnel: <tunnel-id>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

### 5. 添加 DNS 记录

```bash
cloudflared tunnel route dns my-blog api.yourdomain.com
```

### 6. 启动隧道

```bash
cloudflared tunnel run my-blog
```

### 7. 配置前端

在 .env 文件中设置：

```env
VITE_API_BASE=https://api.yourdomain.com/api
```

---

## 方案二：Sakura Frp（一键脚本默认）

### 1. 下载 frpc

登录 [Sakura Frp 管理面板](https://www.natfrp.com/user/)，打开「软件下载」，下载
Windows amd64 版本的 frpc，将 `frpc_windows_amd64.exe` 放到 `~\sakura-frp\` 目录下
（也可以改名为 `frpc.exe`，脚本会自动查找）。

### 2. 创建隧道

在「隧道列表」中创建两条隧道，**名称必须为 `blog` 和 `assistant`**：

| 隧道名称 | 本地地址 | 用途 |
|----------|----------|------|
| `blog` | `127.0.0.1:3001` | 博客后端 API |
| `assistant` | `127.0.0.1:3080` | DeepSeek Harness |

推荐使用 `TCP` 隧道并开启「自动 HTTPS」（免备案节点即可用，地址形如
`https://节点域名:端口`）；如果你有自己的域名，也可以创建 `HTTP(S)` 隧道并绑定域名。

> `blog` 隧道**必须**支持 HTTPS（自动 HTTPS 或 HTTPS 类型隧道），否则浏览器会因
> 混合内容拦截 API 请求，脚本会直接报错。`assistant` 隧道未开 HTTPS 时脚本会警告
> 但仍继续（在新标签页打开，不受混合内容限制）。脚本会自动探测隧道的 http/https。

### 3. 绑定免费子域名（消除证书警告，推荐）

开启自动 HTTPS 后，frpc 默认使用**自签证书**：curl 等工具能忽略证书错误，但浏览器会
直接拦截来自 https 站点的 API 请求。Sakura Frp 为所有用户提供免费的 `*.nyat.app`
子域名和 SSL 证书：

1. 面板「[子域绑定](https://www.natfrp.com/tunnel/domain)」自助申请一个子域名
2. 把子域名绑定到已开启「自动 HTTPS」的 `blog` 隧道（`assistant` 如需要无警告访问也可绑定）
3. 重启隧道，frpc 日志出现「已从服务器为 xxx.nyat.app 加载证书」即生效

绑定后隧道地址变为 `https://xxx.xxx.nyat.app:端口`，证书有效，浏览器可直接调用。
脚本检测到自签证书时会给出对应警告。

### 4. 配置访问密钥

```powershell
Copy-Item sakura-frp.example.json sakura-frp.json
```

编辑 `sakura-frp.json`，填入：

- `token`：面板「用户信息 → 查看访问密钥」
- `tunnels.blog` / `tunnels.assistant`：上一步创建的两条隧道的 ID

> `sakura-frp.json` 已被 .gitignore 忽略，访问密钥不会被提交到仓库。

### 5. 启动隧道

```powershell
.\start-tunnel.ps1
```

脚本会启动 frpc、从日志读取两条隧道的公网地址，并自动更新部署变量。

### 6. 配置前端

一键脚本会自动更新 `VITE_API_BASE` 和 `VITE_ASSISTANT_URL`；手动配置时：

```env
VITE_API_BASE=https://节点域名:端口/api
```

---

## 方案三：ngrok

### 1. 安装 ngrok

```bash
# Windows
winget install ngrok

# macOS
brew install ngrok

# Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok-v3-stable-linux-amd64.tgz | tar -xz
sudo mv ngrok /usr/local/bin
```

### 2. 配置 authtoken

```bash
ngrok config add-authtoken <your-token>
```

### 3. 启动隧道

```bash
ngrok http 3001
```

### 4. 配置前端

复制 ngrok 提供的 HTTPS URL，在 .env 文件中设置：

```env
VITE_API_BASE=https://xxxx.ngrok.io/api
```

---

## 方案四：frp

### 1. 服务端配置

在有公网 IP 的服务器上安装 frps：

```bash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.58.0/frp_0.58.0_linux_amd64.tar.gz
tar -xzf frp_0.58.0_linux_amd64.tar.gz
cd frp_0.58.0_linux_amd64
```

配置 frps.toml：

```toml
bindPort = 7000
vhostHTTPPort = 8080
```

启动：

```bash
./frps -c frps.toml
```

### 2. 客户端配置

在本机安装 frpc：

```bash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.58.0/frp_0.58.0_windows_amd64.zip
```

配置 frpc.toml：

```toml
serverAddr = "your-server-ip"
serverPort = 7000

[[proxies]]
name = "blog"
type = http
localPort = 3001
customDomains = ["yourdomain.com"]
```

启动：

```bash
./frpc -c frpc.toml
```

### 3. 配置 Nginx

在服务器上配置 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 更新前端配置

无论使用哪种方案，都需要更新前端配置：

```env
# .env
VITE_API_BASE=https://your-tunnel-url/api
```

然后重新构建：

```bash
npm run build
```

---

## 一键启动脚本（推荐）

仓库根目录提供了两个脚本，自动完成「启动后端 + 启动隧道 + 更新 GitHub 部署变量 + 触发部署」。
默认使用 Sakura Frp，可通过 `-Tunnel ngrok` 切换回 ngrok（切换时会自动停止另一个客户端的进程）：

```powershell
# 启动（默认 Sakura Frp；后端未运行会自动拉起；隧道地址变化时自动更新变量并触发 GitHub Pages 部署）
.\start-tunnel.ps1

# 换回 ngrok
.\start-tunnel.ps1 -Tunnel ngrok

# 只启动服务，不触发部署
.\start-tunnel.ps1 -SkipDeploy

# 停止隧道（可选 -StopBackend 同时停止本机后端）
.\stop-tunnel.ps1
```

脚本要求：

- `gh` CLI 已登录（用于更新仓库变量和触发部署）
- Sakura Frp（默认）：已下载 frpc 到 `~\sakura-frp\`，且 `sakura-frp.json` 已填写访问密钥和隧道 ID，两条隧道在面板中的名称必须为 `blog` 和 `assistant`
- ngrok：已安装且已配置 authtoken（优先使用 `~\ngrok\ngrok.exe`，其次 winget 安装路径）

注意：免费版 ngrok 每次重启隧道地址都会变；Sakura Frp 的隧道地址通常固定。
脚本检测到地址变化后会自动更新仓库变量 `VITE_API_BASE` / `VITE_ASSISTANT_URL` 并重新部署，无需手动改代码。
