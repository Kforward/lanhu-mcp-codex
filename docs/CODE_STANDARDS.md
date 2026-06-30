# 代码开发规范

## 分层原则

- `src/index.ts` 只负责创建 MCP server 和注册工具。
- `src/tools/*` 是工具业务编排层，只做参数校验、调用 core、组织 MCP 返回。
- `src/core/*` 放基础能力和领域能力，包括 URL 解析、HTTP 请求、蓝湖 API、产物写入、上下文生成。
- `src/utils/*` 只放跨模块复用的纯工具函数。

## 复用规则

- 同一能力只能有一个权威实现。
- 第二处出现相似逻辑时，必须提取复用函数。
- 工具层禁止重复实现 URL 解析、HTTP 请求、文件写入、下载逻辑。
- 基础函数要保持可测试，优先纯函数，副作用集中在 HTTP 和文件模块。

## 函数职责

- 一个函数只承担一个主要职责。
- URL 解析、请求、响应规范化、下载、Markdown 渲染分开实现。
- 业务组合通过小函数串联，不在单个函数里堆积多层判断。

## 错误处理

- MCP 工具返回结构化错误：`ok: false`、`code`、`message`、可选 `status/url/suggestion`。
- 缺 `LANHU_COOKIE`、缺 `pid/tid`、403/418、非 JSON 响应必须给出清楚建议。
- 缩略图下载失败不阻断 context 生成，只写入 `warnings`。

## 安全约束

- 不打印、不保存、不写入 `LANHU_COOKIE`。
- 测试 fixture 不允许包含真实 Cookie、真实账号信息或私密响应。
- V1 不执行任何蓝湖写操作。

## 测试规范

- URL parser 覆盖已知蓝湖路由和缺参错误。
- HTTP client 使用 mock `fetch`，不访问真实网络。
- Context generator 使用 fixture 和 mock 下载，输出路径与 warning 可预测。
- 每次阶段性开发结束后更新 `docs/STATUS.md`。
