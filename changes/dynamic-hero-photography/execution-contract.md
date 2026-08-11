# 执行合同

## Intent Lock

- **变更名称**：dynamic-hero-photography
- **要解决的问题**：首页 Hero 摄影网格固定为 3 个槽位，后台无法增删图片，无法满足用户以不确定数量展示真实摄影作品的需求。
- **范围内**：`heroImages` 任意数量配置；后台添加/删除/上传/编辑摄影作品；首页动态网格、移动端展示、空数组不渲染；超过 8 张时的“精选拼贴 + 展开全部”交互；相关测试与文档。
- **范围外**：拖拽排序、独立相册、摄影作品数据表、认证/CSRF 安全边界修复、首页整体主题重设计。

## Approved Behavior

- **已批准需求摘要**：
  - `PUT /api/config` 接受任意长度 `heroImages`，校验每项 `id`、`url`、`alt` 均为非空字符串，非法输入返回 400。
  - `heroImages` 不超过 8 项时，首页 Hero 网格按配置逐张渲染，桌面与移动端都展示。
  - 保存 `heroImages: []` 后首页完全不渲染摄影网格，也不显示空状态提示。
  - `heroImages` 超过 8 项时，首页先展示前 6 张精选拼贴与“展开全部 N 张作品”入口；点击后原地展开全部图片的紧凑画廊，可再次收起。
  - 后台配置编辑区可为摄影作品新增条目、删除条目、上传图片或填写 URL 与描述。
  - 存量 3 项配置原样返回与渲染，无需迁移。
- **关键场景**：
  - 后台保存 5 张作品，首页渲染 5 张。
  - 后台保存空数组，首页无摄影网格。
  - 后台保存 20 张作品，首页先展示 6 张与展开入口，展开后显示 20 张，收起后恢复 6 张。
  - 后台提交缺少 `alt` 的作品，接口返回 400 且不写入。
- **验收检查**：
  - `npm test` 通过（服务端与前端项目）。
  - `npm run lint` 通过。
  - `npm run test:e2e -- config.spec.ts` 通过。
  - 后台保存后的图片数量与顺序在首页可见。

## Design Constraints

- **架构约束**：不新增 API 端点；继续以 `heroImages: HeroImage[]` 作为唯一数据源；不引入新的布局或状态管理依赖。
- **接口约束**：`HeroImage` 保持 `{ id, url, alt }`；`PUT /api/config` 校验非空字段；上传复用 `POST /api/upload/image`。
- **依赖约束**：使用项目已有的 `LazyImage` 实现懒加载；不使用瀑布流库；不修改现有依赖清单。
- **数据约束**：配置仍通过 `storage.ts` 的 `config.json` 映射写入 SQLite；`heroImages` 作为数组持久化，不迁移存量数据。

## Execution Plan

full/hotfix 先运行 `ssf execution recommend`，按任务量和 wave 策略列出可用方式并
推荐一种，同时保存匹配当前 wave 的 recommendation receipt。Agent 展示候选项和理由，
`plan` 和 `revise` 均只接受仍匹配 artifact、contract 和 wave 的凭据；用户通过 `--confirm` 明确确认；选择非推荐方式时
还必须记录 `--acknowledge-recommendation`。Batch Inline 是串行模式，不得描述为并行。批准后，
`ssf execution plan` 会把当前执行计划保存到
`<change>/.superpowers/sdd/execution-plan.json`；该 JSON 是计划的持久化控制面，
不是本 execution contract 的一部分。

## Execution Waves

每个 wave 必须有唯一 ID；只有依赖 wave 的 review receipt 为 `pass` 后，后续
wave 才可以开始。`parallel` 只表示允许在宿主支持并发派发时同时执行；不支持并发时
必须明确报告该能力不可用，而不能把 `parallel` 计划悄然改写成串行执行。

### Wave 1: server-config

- **Wave ID**：server-config
- **任务**：任务 1（服务端配置校验与测试）
- **依赖 wave**：无
- **策略**：`serial`
- **目标**：`PUT /api/config` 支持任意长度 `heroImages` 并校验字段，服务端测试覆盖 0/5 项与非法字段。
- **输入**：`server/routes/config.ts`、`server/__tests__/config.test.ts`
- **输出**：通过的服务端测试与更新后的 JSDoc。
- **完成标准**：`npx vitest run server/__tests__/config.test.ts` 通过。
- **Review gate**：review report 路径、base/head SHA、review receipt（`pass` | `fail`）

### Wave 2: frontend-experience

- **Wave ID**：frontend-experience
- **任务**：任务 2（首页动态 Hero 网格）与任务 3（后台配置编辑区）
- **依赖 wave**：server-config
- **策略**：`serial`
- **目标**：首页按配置数量渲染并支持空数组与 8 张以上展开/收起；后台支持添加、删除、上传与编辑。
- **输入**：`src/components/home/HeroSection.tsx`、`src/components/ConfigManager.tsx`、对应组件测试
- **输出**：通过的前端组件测试与可用的前后台交互。
- **完成标准**：`npx vitest run src/__tests__/HeroSection.test.tsx src/__tests__/ConfigManager.test.tsx` 通过。
- **Review gate**：review report 路径、base/head SHA、review receipt（`pass` | `fail`）

### Wave 3: integration-docs

- **Wave ID**：integration-docs
- **任务**：任务 4（e2e 流程与文档）
- **依赖 wave**：frontend-experience
- **策略**：`serial`
- **目标**：e2e 覆盖后台添加摄影作品并保存后首页可见；README 与 API/JSDoc 同步。
- **输入**：`e2e/config.spec.ts`、`README.md`
- **输出**：通过的 e2e 与准确文档。
- **完成标准**：`npm run test:e2e -- config.spec.ts` 与 `npm run lint` 通过。
- **Review gate**：review report 路径、base/head SHA、review receipt（`pass` | `fail`）

## Test Obligations

- **必须先从失败测试开始的行为**：服务端任意长度与字段校验；Hero 网格 0/1/5/20 张行为；后台添加、删除与保存。
- **必需的边界情况**：空数组不渲染；20 张展开前 6 张、展开后 20 张、收起恢复；缺少 `id`/`url`/`alt` 返回 400；存量 3 项原样返回。
- **回归敏感区域**：`HeroSection` 原 3 张布局、`ConfigManager` 保存流程、`PUT /api/config` 校验。

## Execution Mode

- **可用方式与推荐**：`ssf execution recommend <change-dir> [--wave <id>:<parallel|serial>:<task,...>[:<depends-on,...>]]`
- **用户确认的模式**：`sdd` | `inline` | `batch-inline`
- **推荐理由 / 项目事实**：待 `ssf execution recommend` 生成后填写。
- **非推荐选择的风险确认**：`--acknowledge-recommendation`（若适用）
- **执行计划命令**：`ssf execution plan <change-dir> --mode <mode> --confirm --reason <text> --wave <id>:<parallel|serial>:<task,...>[:<depends-on,...>] [--acknowledge-recommendation]`
- **允许的修订**：将已有计划保留/升级为 `sdd`；先重新 recommend，并以 `--confirm` 生成新 revision 和清除旧 receipt；不允许降级：`ssf execution revise <change-dir> --mode sdd --confirm --reason <text> --wave <id>:<parallel|serial>:<task,...>[:<depends-on,...>] [--acknowledge-recommendation]`
- **计划 revision / artifact hash**：由 `ssf state init` 记录。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | — |
| Correctness | Pending | — |
| Coherence | Pending | — |

**总体结论**：Pending

## Review Gates

- **强制审查点**：每个 Execution Wave 完成后记录 `ssf execution review` 的 review receipt
- **阻塞类别**：依赖未通过、review receipt 为 `fail`、缺失或过期
- **收口条件**：所有当前 wave 都有 `pass` review receipt

## Escalation Rules

- **何时回退到 `specifying`**：需求或范围出现合同未覆盖的实质性变化，或验收条件与 `specs/` 冲突。
- **何时回退到 `bridging`**：实现约束超出合同 Design Constraints，或新事实使批次划分失效。
- **何时不得继续实现**：缺少 DP-3 批准、缺少当前 `ssf execution plan`、任何依赖 wave 无 `pass` review receipt、测试结果不通过。
