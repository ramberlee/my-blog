# Tasks: 动态摄影作品 Hero 网格

## Delivery / Proof Map

| 交付物 | 证据 |
|---|---|
| 服务端任意数量校验 | `server/__tests__/config.test.ts` 覆盖 0/5 项成功与非法字段 400 |
| 首页动态网格 | `src/__tests__/HeroSection.test.tsx` 覆盖 1/5/0 张图片与 20 张展开/收起交互 |
| 后台增删上传 | `src/__tests__/ConfigManager.test.tsx` 覆盖添加、删除与保存 |
| 端到端流程 | `e2e/config.spec.ts` 覆盖后台添加并保存摄影作品后首页可见 |
| 文档同步 | `README.md` API 与项目结构章节无过期描述 |

## Tasks

- [x] 1. 服务端配置校验与测试

   - 范围：`server/routes/config.ts`、`server/__tests__/config.test.ts`
   - 结果：`PUT /api/config` 接受任意长度 `heroImages`，校验每项 `id`/`url`/`alt` 非空；JSDoc 与测试同步更新
   - 证据：`npx vitest run server/__tests__/config.test.ts`

- [x] 2. 前台动态 Hero 网格与测试

   - 范围：`src/components/home/HeroSection.tsx`、`src/__tests__/HeroSection.test.tsx`
   - 结果：Hero 网格按配置数量渲染，桌面与移动端均展示；空数组完全不渲染网格；超过 8 张先展示 6 张精选拼贴与“展开全部”入口，展开后渲染全部图片并可收起，全程使用懒加载
   - 依赖：任务 1 确定接口契约后完成
   - 证据：`npx vitest run src/__tests__/HeroSection.test.tsx`

- [x] 3. 后台配置编辑区的添加、删除与上传

   - 范围：`src/components/ConfigManager.tsx`、`src/__tests__/ConfigManager.test.tsx`
   - 结果：编辑区可为摄影作品新增条目、删除条目、上传图片或填写 URL/描述，保存后配置同步
   - 依赖：任务 1 确定接口契约后完成
   - 证据：`npx vitest run src/__tests__/ConfigManager.test.tsx`

- [x] 4. 端到端流程与文档

   - 范围：`e2e/config.spec.ts`、`README.md`
   - 结果：e2e 覆盖后台添加摄影作品并保存后首页可见；README 的 API 说明与项目结构保持准确
   - 依赖：任务 2、3 完成后执行
   - 证据：`npm run test:e2e -- config.spec.ts` 与 `npm run lint`
