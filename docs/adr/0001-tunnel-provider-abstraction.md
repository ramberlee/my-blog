# ADR-001: 隧道脚本支持多提供商（Sakura Frp 默认 / ngrok 可选）

## Status
Accepted

## Context

博客通过内网穿透把本机后端（3001）与 DeepSeek Harness（3080）暴露到公网，
`start-tunnel.ps1` 负责启动隧道并把公网地址写入 GitHub 仓库变量后触发部署。
此前只支持 ngrok，存在两个问题：

- 免费版 ngrok 每次重启都会更换隧道地址，且对浏览器请求插入拦截警告页
  （前端需要携带 `ngrok-skip-browser-warning` 头规避）；
- 用户希望改用 Sakura Frp（地址稳定、国内访问更友好），同时保留 ngrok 作为备选。

## Decision

- 隧道启动逻辑按「提供商」拆分，`start-tunnel.ps1` 新增 `-Tunnel` 参数：
  `sakura`（默认）或 `ngrok`；启动某一提供商时自动停止另一提供商的客户端进程。
- Sakura Frp 通过官方 frpc 启动：`frpc -f <访问密钥>:<blogId>,<assistantId>`，
  从 stdout 日志中的
  `Your <name> proxy is available now. Use >><url><< to connect.` 行解析两条隧道的公网地址；
  隧道在面板中的名称固定为 `blog` 和 `assistant`。
- 访问密钥与隧道 ID 存放在仓库内不被跟踪的 `sakura-frp.json`
  （模板为 `sakura-frp.example.json`，已加入 .gitignore）。
- 隧道连通性检查改用 `curl.exe -k`（Sakura Frp 自动 HTTPS 使用自签证书，
  `Invoke-RestMethod` 会因证书校验失败）。
- DSH 的 `--trusted-host` 使用 URL 的 `Authority`（含端口），
  以匹配 Sakura Frp TCP 隧道 `https://节点:端口` 的 Host 头；对 ngrok 无行为变化。

## Rationale

- frpc 的 `-f` 开关是官方推荐的免配置文件启动方式，日志解析无需额外 API 令牌，
  且 frpc 远程管理功能已官方弃用（v0.45.0-sakura-7 移除）。
- 密钥不落仓库：`sakura-frp.json` 被 gitignore，示例文件只含占位符。
- 保留 ngrok 路径与原有 `ngrok.yml`、本地 API 读取逻辑，切换成本为零。

## Consequences

- 正向：默认获得稳定的 Sakura Frp 地址；`-Tunnel ngrok` 可一键回退；两种提供商共用
  后端、DSH、变量更新与部署触发流程。
- 负面：使用 Sakura Frp 需在面板创建两条名称固定的隧道并下载 frpc；
  若隧道改名，脚本会报错并列出日志中发现的隧道名。
- 后续：如需更多提供商（如 Cloudflare Tunnel），按相同「提供商函数 + 地址解析」模式扩展。
