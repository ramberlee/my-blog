# Task 2 Brief: 前台动态 Hero 网格与测试

## Scope

- `src/components/home/HeroSection.tsx`
- `src/__tests__/HeroSection.test.tsx`
- `src/__tests__/setup.ts`（仅当需要让 `LazyImage` 的 IntersectionObserver 在测试中触发渲染时，才允许调整 mock；这是测试基础设施的必要修改）

## Required Behavior

1. `heroImages` 非空且不超过 8 项时，SHALL 为每项渲染一张图片（使用 `url` 与 `alt`），桌面与移动端都展示，不要求恰好 3 项。
2. 保存空数组时，SHALL 完全不渲染摄影网格，也不显示空状态文案。
3. 超过 8 项时，SHALL 先展示前 6 张精选拼贴与“展开全部 N 张作品”入口；点击后原地展开全部图片的紧凑画廊，再次点击收起。
4. 展开入口 SHALL 使用原生 `<button>` 与 `aria-expanded`，并显示剩余作品数量。
5. 所有网格图片 SHALL 使用现有 `LazyImage` 组件懒加载。
6. 保持现有 Hero 文案、导航、CTA 与主题变量不变。

## TDD Requirement

先更新测试覆盖 1 张、5 张、0 张、20 张四种配置，运行 `npx vitest run src/__tests__/HeroSection.test.tsx` 确认 RED，再实现到 GREEN。

## Existing Code Facts

- 当前 `HeroSection.tsx` 要求 `heroImages.length === 3` 才使用配置，否则回退默认图，并把数组解构为 3 个槽位。
- 当前网格带 `hidden md:grid`，移动端不展示，需要改为响应式展示。
- `src/components/LazyImage.tsx` 已存在，接受 `src`、`alt`、`style` 等 props。
- 测试文件已 mock `configApi.get` 与 `resolveAssetUrl`。

## Completion

- 测试覆盖：1 张渲染 1 张；5 张渲染 5 张；0 张无网格容器且无空状态文案；20 张初始 6 张 + 展开按钮；点击后 20 张；再点击恢复 6 张。
- `npx vitest run src/__tests__/HeroSection.test.tsx` 通过。
- 提交 commit，说明引用任务编号。
