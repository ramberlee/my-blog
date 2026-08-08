# AGENTS.md — 文档维护规范

> 本文件的作用域：`E:\agents\MyWebsite\my-blog\` 整个目录树。
> 所有在此项目中工作的 Agent 必须遵守以下文档规范。

## 核心原则

**过时的文档比没有文档更糟糕。** 每次修改代码时，必须同步更新相关文档。

五条铁律（来自 code-documentation skill）：

1. **为读者写作** — 新开发者看快速开始，API 消费者看端点示例
2. **文档靠近代码** — JSDoc 紧贴函数定义，README 在仓库根目录
3. **代码变了文档就变** — 这是本文件存在的唯一理由
4. **示例胜过解释** — 给可运行的代码，不要给散文
5. **渐进式披露** — 快速开始在前，API 细节在后

---

## 一、JSDoc 注解规范

### 何时必须添加 JSDoc

| 场景 | 必须注解 | 可以跳过 |
|------|----------|----------|
| 后端路由处理函数 | ✅ | — |
| 后端工具函数（storage.ts 等） | ✅ | — |
| 前端 API 客户端方法 | ✅ | — |
| 前端共享接口（Article, SiteConfig 等） | ✅ | — |
| 自定义 Hook | ✅ | — |
| 简单的 React 组件 props | — | ✅（用 TypeScript 类型自文档化） |
| 内部私有辅助函数 | — | ✅（除非逻辑复杂） |
| 测试文件 | — | ✅ |

### JSDoc 必须包含的标签

**后端路由函数：**
```typescript
/**
 * POST /api/articles
 *
 * 一句话说明端点做什么。
 *
 * @requestBody `{ title: string, content: string, ... }`
 * @returns `Article` — 201
 * @returns `{ error: string }` — 404 if not found
 *
 * @example
 * ```
 * POST /api/articles
 * { "title": "新文章", "content": "..." }
 * → { "id": "1706140800000", "createdAt": "2024-01-25", ... }
 * ```
 */
```

**工具函数：**
```typescript
/**
 * 一句话说明函数做什么。
 *
 * @typeParam T - 泛型参数说明
 * @param filename - 参数说明
 * @param fallback - 参数说明
 * @returns 返回值说明
 * @throws 什么条件下抛出异常
 *
 * @example
 * ```ts
 * const data = readJSON<Article[]>('articles.json', [])
 * ```
 */
```

**前端 API 客户端方法：**
```typescript
/** Fetches all articles (draft + published) */
list: () => request<Article[]>('/articles'),

/** Creates a new article. `id`, `createdAt`, `updatedAt` are auto-generated. */
create: (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => ...
```

### 注解风格规则

- **第一行是摘要**，用一句话概括，不以 "This function" 开头
- **用英文写注解**（项目代码用英文，内容用中文）
- **解释 WHY，不是 WHAT** — 不要重复代码已经表达的意思
- **给示例** — 每个公共 API 都要有 `@example`
- **接口的每个字段**都要有 `/** 单行注释 */`

---

## 二、README.md 维护规则

README 是项目的第一印象。以下章节必须保持最新：

### 必须同步更新的章节

| 触发条件 | 更新章节 |
|----------|----------|
| 新增/删除/修改 API 端点 | 📡 API 文档 |
| 新增/删除 npm 依赖 | 🛠️ 技术栈 |
| 新增/删除路由 | 🗺️ 路由结构 |
| 新增/删除页面或组件 | 📁 项目结构 |
| 新增/删除 npm script | 🚀 快速开始 |
| 新增/删除测试文件 | 🧪 测试说明 |
| 修改认证逻辑 | 🔐 认证系统 |
| 修改 CSS 变量结构 | 📝 配置说明 → 主题定制 |
| 新增功能 | ✨ 功能特性 |

### API 文档格式

每个端点必须包含：
1. HTTP 方法 + 路径（作为标题）
2. 一句话说明
3. 请求体 JSON 示例（如有）
4. 成功响应示例（带状态码）
5. 错误响应示例（带状态码）
6. 业务逻辑说明（如自动生成字段、深度合并等）

示例格式：
```markdown
#### 创建文章

\`\`\`
POST /api/articles
{ "title": "新文章标题", "content": "...", "status": "draft" }
→ 201 { "id": "1706140800000", "createdAt": "2024-01-25", ... }
\`\`\`

> `id`、`createdAt`、`updatedAt` 由服务端自动生成。
```

### 项目结构树

当新增文件时，必须更新 `📁 项目结构` 章节的目录树，包括：
- 文件路径
- 一行中文注释说明用途

---

## 三、内联注释规范

### 什么时候写注释

**写：**
- 解释 WHY（为什么这样做）而不是 WHAT（做了什么）
- 复杂业务逻辑的决策依据
- Workaround 和 HACK（附 issue 链接或浏览器 bug 编号）
- 非直觉的性能优化选择

**不写：**
- 重复代码已经表达的意思
- `// Increment counter` 之类的废话
- 过时的注释（比不写更糟）

### 格式

```typescript
// GOOD: 解释原因
// Use binary search because the list is always sorted
const index = binarySearch(items, target);

// GOOD: 记录 workaround
// HACK: Safari doesn't support this API, fallback to polling
// TODO: Remove when Safari adds support (tracking: webkit.org/b/12345)

// BAD: 重复代码
// Check if user is admin
if (user.role === 'admin') { ... }
```

---

## 四、架构决策记录 (ADR)

当做出以下决策时，必须在 `docs/adr/` 目录下创建 ADR：

- 选择数据库或存储方案
- 选择认证方案
- 选择部署架构
- 重大重构方向
- 引入新的核心依赖

ADR 格式：
```markdown
# ADR-NNN: 决策标题

## Status
Accepted | Superseded | Deprecated

## Context
背景和问题描述。

## Decision
做了什么决定。

## Rationale
为什么选这个方案（列出考虑过的替代方案）。

## Consequences
这个决定带来的正面和负面影响。
```

---

## 五、自动检查清单

每次修改代码后，Agent 必须检查：

```
□ 新增/修改了 API 端点？
  → 更新 server/routes/ 中对应文件的 JSDoc
  → 更新 src/utils/api.ts 中对应方法的 JSDoc
  → 更新 README.md 的 API 文档章节（含请求/响应示例）

□ 新增/删除/重命名了文件？
  → 更新 README.md 的项目结构树

□ 新增/删除了路由？
  → 更新 README.md 的路由结构表

□ 新增了 npm 依赖？
  → 更新 README.md 的技术栈表

□ 新增了测试文件？
  → 更新 README.md 的测试覆盖范围表

□ 修改了认证逻辑？
  → 更新 README.md 的认证系统章节

□ 做了架构决策？
  → 创建 docs/adr/NNN-decision-title.md

□ 修改了组件的公共接口？
  → 更新对应文件的 JSDoc
```

---

## 六、文档质量门禁

以下情况视为文档不合格：

- JSDoc `@returns` 描述与实际返回值不一致
- README API 示例中的请求/响应与实际代码不符
- 项目结构树缺少新增文件
- 路由表缺少新增路由
- 技术栈表缺少新增依赖
- 接口字段缺少 `/** 注释 */`
- 函数有 `@param` 但缺少 `@example`

**文档不合格 = 任务未完成。**
