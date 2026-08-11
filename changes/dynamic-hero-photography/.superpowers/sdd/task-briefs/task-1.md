# Task 1 Brief: 服务端配置校验与测试

## Scope

- `server/routes/config.ts`
- `server/__tests__/config.test.ts`

## Required Behavior

1. `PUT /api/config` SHALL 接受任意长度（含空数组）的 `heroImages`。
2. `heroImages` 每一项 SHALL 具备非空字符串 `id`、`url`、`alt`。
3. 任一字段缺失或为空 SHALL 返回 400 与错误信息，且不写入配置。
4. 已有恰好 3 项的存量配置 SHALL 原样返回与渲染，不截断、不重排。
5. `GET /api/config` 在无存储配置时继续返回默认 3 项。

## TDD Requirement

先写失败测试，运行 `npx vitest run server/__tests__/config.test.ts` 确认 RED，再实现到 GREEN。测试必须是行为断言，例如提交 5 项成功、空数组成功、缺少 `alt` 返回 400、空 `id` 返回 400、存量 3 项原样返回。

## Existing Code Facts

- `server/routes/config.ts` 目前只校验 `url`/`alt` 是否为 string，未校验非空，也未校验 `id`。
- GET/PUT 的 JSDoc 应同步改为“任意数量摄影作品”。
- 测试通过 mock `storage.js` 运行，不涉及真实数据库迁移。

## Completion

- 新增测试覆盖 0 项、5 项、缺少字段、空字段、存量 3 项。
- 该测试文件全部通过，输出干净。
- 提交 commit，说明引用任务编号。
