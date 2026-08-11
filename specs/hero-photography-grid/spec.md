# hero-photography-grid

## Purpose

The hero-photography-grid capability documents the published behavior for users and maintainers.

## Requirements

### Requirement: 后台配置界面可添加摄影作品

后台“首页摄影作品”编辑区 SHALL 提供“添加图片”操作；点击后 SHALL 在当前列表末尾追加一个新条目，新条目 SHALL 拥有稳定的 `id`，并允许用户上传本地图片或填写 URL 与描述。

#### Scenario: 添加一条新摄影作品

WHEN 用户在后台配置编辑区点击“添加图片”
THEN 列表末尾出现一个新条目，且该条目可以保存到 `/api/config`

### Requirement: 后台配置界面可删除摄影作品

后台“首页摄影作品”编辑区 SHALL 为每个条目提供删除操作；删除后该条目 SHALL 从本地编辑表单移除，保存后 SHALL 不再出现在首页 Hero 网格中。

#### Scenario: 删除一条摄影作品

WHEN 用户删除列表中的某一条并点击“保存配置”
THEN 首页 Hero 网格不再渲染该条目的图片

### Requirement: 首页 Hero 网格按配置数量动态渲染

当配置中的 `heroImages` 非空且不超过 8 项时，首页 Hero 网格 SHALL 为数组中的每一项渲染一张图片；SHALL NOT 要求数组长度必须等于 3；移动端与桌面端 SHALL 都展示该网格。

#### Scenario: 配置 1 张图片

WHEN `heroImages` 只包含 1 项
THEN 首页 Hero 网格渲染 1 张图片且图片使用该项的 `url` 与 `alt`

#### Scenario: 配置 5 张图片

WHEN `heroImages` 包含 5 项
THEN 首页 Hero 网格渲染 5 张图片，且顺序与配置数组一致

### Requirement: 空配置时不渲染摄影网格

当用户保存了空的 `heroImages` 数组时，首页 SHALL NOT 渲染摄影网格，也 SHALL NOT 展示空状态提示，页面表现如同 Hero 中不存在该网格。

#### Scenario: 保存空数组

WHEN 后台保存 `heroImages: []`
THEN 首页 Hero 区域不渲染任何摄影图片、网格容器或空状态文案

### Requirement: 图片较多时提供精选拼贴与展开入口

当 `heroImages` 数量超过 8 张时，首页 Hero 摄影网格 SHALL 先渲染前 6 张图片组成的精选拼贴，并渲染一个带图片数量和可访问按钮语义的“展开全部”入口；点击入口后 SHALL 在原地展开完整紧凑画廊，SHALL 为所有图片使用一致的宽高比与懒加载，且 SHALL 提供收起操作恢复精选拼贴。

#### Scenario: 配置 20 张图片并展开

WHEN `heroImages` 包含 20 项
THEN 首页 Hero 网格先展示前 6 张图片与“展开全部 20 张作品”入口
AND 当用户点击展开入口后，首页原地渲染全部 20 张图片的紧凑画廊
AND 当用户再次点击收起后，首页恢复为前 6 张图片与展开入口

### Requirement: 服务端接受任意数量的摄影作品配置

`PUT /api/config` SHALL 接受任意长度（含空数组）的 `heroImages`，并 SHALL 校验每一项的 `id`、`url`、`alt` 都是非空字符串；任一字段缺失或为空 SHALL 返回 400。

#### Scenario: 保存 5 张摄影作品

WHEN 客户端提交包含 5 项合法 `heroImages` 的 PUT 请求
THEN 接口返回 200，响应中的 `heroImages` 与提交内容一致

#### Scenario: 保存空数组

WHEN 客户端提交 `heroImages: []`
THEN 接口返回 200，响应中的 `heroImages` 为空数组

#### Scenario: 拒绝缺少描述的作品

WHEN 客户端提交某一项缺少 `alt` 的 `heroImages`
THEN 接口返回 400 与错误信息，且不写入配置

### Requirement: 存量三图配置无需迁移

已有 `heroImages` 恰好为 3 项的存量配置 SHALL 继续按原样返回与渲染，服务端 SHALL NOT 强制扩展、截断或重排。

#### Scenario: 读取存量三图配置

WHEN 存储中的 `heroImages` 为 3 项
THEN `GET /api/config` 原样返回 3 项，首页 Hero 网格渲染 3 张图片
