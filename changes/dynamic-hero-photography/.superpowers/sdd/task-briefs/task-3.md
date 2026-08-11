# Task 3 Brief: 后台配置编辑区增删上传

## Scope

- `src/components/ConfigManager.tsx`
- `src/__tests__/ConfigManager.test.tsx`

## Required Behavior

1. 编辑模式的“首页摄影作品”区域 SHALL 列出全部 `heroImages` 条目。
2. SHALL 提供“添加图片”操作，在列表末尾追加新条目；新条目 SHALL 使用 `crypto.randomUUID()` 生成稳定 `id`，并允许上传本地图片或填写 URL 与描述。
3. 每个条目 SHALL 提供上传按钮、URL 输入框、描述输入框和删除按钮。
4. 删除 SHALL 仅修改本地编辑表单，点击“保存配置”后通过 `configApi.update` 持久化。
5. 保存 SHALL 允许任意数量，包括空数组。
6. 保持现有“基本信息”“作者信息”“社交链接”等区域与保存/重置/密码流程不变。

## TDD Requirement

先为添加条目、删除条目、保存后提交的新列表添加测试，运行 `npx vitest run src/__tests__/ConfigManager.test.tsx` 确认 RED，再实现到 GREEN。

## Existing Code Facts

- 当前 `ConfigManager.tsx` 只映射已有条目，没有添加/删除按钮，标签写死为“主图/侧图”。
- 现有 `handleUpload(e, heroIndex)` 已支持按索引上传，扩展到新增条目时复用同一逻辑。
- 测试已 mock `configApi`、`authApi`、`resolveAssetUrl`。

## Completion

- 测试覆盖：点击“添加图片”出现新条目；删除条目后保存提交的新数组不含该条目；保存空列表可提交空数组。
- `npx vitest run src/__tests__/ConfigManager.test.tsx` 通过。
- 提交 commit，说明引用任务编号。
