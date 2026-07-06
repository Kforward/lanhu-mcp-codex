# 蓝湖只读 MCP 项目简介

## 项目目标

本项目是一个项目内私有的蓝湖只读 MCP server，用于把蓝湖项目/设计稿链接转换成 Codex 可直接消费的代码还原上下文。

项目第一原则：辅助 Codex 基于蓝湖设计文稿进行代码还原。

长期目标是辅助 Codex 根据蓝湖设计文稿进行页面/组件代码还原，而不是仅仅列出设计图。

第一版目标是形成最小闭环：

- 解析蓝湖链接中的项目和设计稿参数。
- 通过蓝湖 Web API 只读获取项目画板列表。
- 下载可访问的画板缩略图。
- 生成本地 `context.md` 和 `context.json`。
- 输出页面角色、流程关系、推荐实现顺序和 Codex 实现指引。

## 范围边界

V1 只做 API-only 只读能力：

- 不自动登录蓝湖。
- 不读取浏览器 Cookie、LocalStorage 或用户浏览器配置。
- 不上传、不修改、不删除蓝湖项目内容。
- 不做浏览器自动化兜底。
- 暂不深度解析 Axure/PRD，只记录 `docType=axure` 等链接信息。

## 认证方式

运行前设置环境变量：

```bash
LANHU_COOKIE="从蓝湖请求中复制的 Cookie 请求头"
```

Cookie 只作为请求头发送给蓝湖接口，不写入本地产物，不在日志或错误中打印。

## MCP 工具

- `lanhu_parse_url`：解析蓝湖链接，返回 `pid`、`tid`、`imageId`、`docId`、`docType`、`pageId`、`parentId`、`route`、`rawQuery`。
- `lanhu_list_project_images`：读取项目画板列表，不写入本地文件。
- `lanhu_get_design_context`：读取画板列表并生成本地产物，支持目标画板和组件级还原聚焦。

`lanhu_get_design_context` 生成的 `context.md` 面向 AI Agent 阅读，目标是形成“页面还原任务书”；`context.json` 面向程序读取，包含结构化页面、资源、流程和实现建议。

V1.1.1 起，`lanhu_get_design_context` 还支持：

- `targetImageId` / `targetImageName`：显式指定需要还原的画板。
- `targetDescription`：描述只需要实现的局部组件。
- `targetRegion`：记录局部组件区域，坐标空间可为 `api`、`downloaded` 或 `unknown`。

生成产物会包含 `schema.schemaVersion`、`restoration.targetFocus`、本地缩略图真实像素尺寸、API 到像素倍率和业务落地检查清单。更新代码并重新构建后，需要重启 Codex/MCP，避免长进程继续使用旧构建。

## 本地产物

默认写入：

```text
.lanhu-mcp.local/runs/{timestamp}-{pidShort}/
├── context.json
├── context.md
└── images/
```

`.lanhu-mcp.local/` 是运行产物目录，不应提交到版本控制。

## Codex 本地配置示例

推荐先把 Cookie 设置为 Windows 用户环境变量，不把 Cookie 明文写入 Codex 配置：

```powershell
setx LANHU_COOKIE "从蓝湖请求中复制的 Cookie 请求头"
```

将路径替换为本项目的绝对路径。下面的 wrapper 会在 MCP 启动时从用户/系统环境变量读取 `LANHU_COOKIE`：

```toml
[mcp_servers.lanhu-readonly]
type = "stdio"
cwd = "C:\\Users\\Yalaw\\Documents\\Codex\\2026-06-30\\new-chat-2"
command = "powershell"
args = ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "$cookie = [Environment]::GetEnvironmentVariable('LANHU_COOKIE', 'User'); if ([string]::IsNullOrWhiteSpace($cookie)) { $cookie = [Environment]::GetEnvironmentVariable('LANHU_COOKIE', 'Machine') }; $env:LANHU_COOKIE = $cookie; & node dist/index.js"]
```

构建后运行：

```bash
npm run build
node dist/index.js
```

修改 MCP 配置或用户环境变量后，需要重启 Codex 桌面端，确保 MCP 子进程拿到最新环境。
