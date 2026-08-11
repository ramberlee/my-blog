# Task 4 Brief: e2e 流程与文档

## Scope

- `e2e/config.spec.ts`
- `README.md`
- `src/utils/api.ts`（仅同步 `HeroImage`/`SiteConfig.heroImages` 的 JSDoc 注释，改为任意数量）

## Required Behavior

1. e2e SHALL 覆盖“后台添加一条摄影作品并保存后，首页 Hero 网格可见该图片”。
2. README SHALL 将 `heroImages` 说明更新为任意数量摄影作品，并同步 API 示例与项目结构中涉及的文件。
3. 若 `server/routes/config.ts` 与 `src/utils/api.ts` 的 JSDoc 尚未说明任意数量，补到一致。

## Existing Code Facts

- `e2e/config.spec.ts` 目前只改网站名称并回到首页验证标题。
- README 的 API 表已有 `GET/PUT /api/config`，但需要补充任意数量语义。
- 前端通过 `src/config/heroImages.ts` 提供默认占位图，README 如涉及需同步说明。

## Completion

- `npm run test:e2e -- config.spec.ts` 通过（按现有 Playwright 配置启动所需服务）。
- `npm run lint` 通过。
- 提交 commit，说明引用任务编号。
