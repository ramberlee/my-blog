# Proposal: 动态摄影作品 Hero 网格

## Why

当前首页 Hero 区域把 `heroImages` 当作恰好 3 个固定槽位使用：前端只在数组长度等于 3 时才读取后台配置，否则回退到默认占位图；后台配置编辑区也只能修改这 3 张图，不能新增或删除。用户希望首页展示自己上传的真实摄影作品，并且上传数量不确定，现有实现无法满足。

## What Changes

- 首页 Hero 摄影网格按 `heroImages` 实际数量动态渲染，支持 0 张、1 张和多张，并补齐移动端展示；配置为空时不渲染摄影网格。
- 图片数量较多时，Hero 先展示精选拼贴与“展开全部”入口，展开后在原地补充完整紧凑画廊，并使用懒加载，避免页面高度失控和首屏性能下降。
- 后台“首页摄影作品”编辑区支持添加、删除、上传图片、填写 URL 与描述，保存后写入现有 `/api/config`。
- 服务端 `PUT /api/config` 校验 `heroImages` 每一项的 `id`、`url`、`alt`，并接受任意长度的数组。
- 补充服务端、前端组件和端到端测试，同步更新 README 文档。

## Scope

### In

- 服务端配置接口对 `heroImages` 任意数量与字段的校验
- 前台 Hero 摄影网格的动态渲染与移动端展示
- 后台配置界面中摄影作品条目的添加、删除、上传与编辑
- 相关单元测试、e2e 测试和文档

### Out

- 拖拽排序、分类、独立相册页面
- 摄影作品的独立数据表或文件管理库
- 修改认证/CSRF 中间件等现有安全边界
- 更换首页整体视觉主题

## Impact

- `server/routes/config.ts`：校验逻辑与 JSDoc
- `src/utils/api.ts`：共享类型与注释
- `src/components/home/HeroSection.tsx`：动态网格渲染
- `src/components/ConfigManager.tsx`：增删、上传、编辑交互
- `src/config/heroImages.ts`：默认占位配置说明
- `src/__tests__/HeroSection.test.tsx`、`src/__tests__/ConfigManager.test.tsx`、`server/__tests__/config.test.ts`、`e2e/config.spec.ts`
- `README.md`：API 文档与结构说明

## Proof of Completion

- 后台配置编辑区可以添加并删除任意数量的摄影作品，保存后首页 Hero 网格显示对应数量和顺序的图片；保存空数组后首页不渲染摄影网格
- 服务端测试覆盖任意长度 `heroImages` 的 GET/PUT 与非法字段拒绝
- 前端组件测试覆盖 0 张、1 张、多张图片渲染、超多图片的展开/收起交互与后台增删交互
- `npm test` 与 `npm run lint` 通过
