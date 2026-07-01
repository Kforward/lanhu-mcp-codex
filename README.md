# lanhu-mcp-codex

蓝湖只读 MCP 服务，用于把蓝湖项目/设计稿链接转换成 Codex 或其他 AI Agent 可消费的设计上下文。

项目第一原则：辅助 Codex 基于蓝湖设计文稿进行代码还原。

## 当前能力

- 解析蓝湖链接中的 `pid`、`tid`、`image_id`、`docType` 等参数。
- 通过蓝湖 Web API 只读获取项目画板列表。
- 下载可访问的画板缩略图。
- 生成本地 `context.md` 和 `context.json`。
- 提供 stdio MCP 工具，适合 Codex 本地接入。

## 快速开始

```bash
npm install
npm run build
npm test
```

设置蓝湖 Cookie：

```bash
LANHU_COOKIE="从蓝湖请求中复制的 Cookie 请求头"
```

启动 MCP：

```bash
node dist/index.js
```

## Codex MCP 配置示例

推荐把 `LANHU_COOKIE` 设置为 Windows 用户环境变量，不把 Cookie 明文写入 `config.toml`：

```powershell
setx LANHU_COOKIE "从蓝湖请求中复制的 Cookie 请求头"
```

将路径替换为本机仓库绝对路径。下面的 wrapper 会在 MCP 启动时从用户/系统环境变量读取 `LANHU_COOKIE`：

```toml
[mcp_servers.lanhu-readonly]
type = "stdio"
cwd = "C:\\path\\to\\lanhu-mcp-codex"
command = "powershell"
args = ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "$cookie = [Environment]::GetEnvironmentVariable('LANHU_COOKIE', 'User'); if ([string]::IsNullOrWhiteSpace($cookie)) { $cookie = [Environment]::GetEnvironmentVariable('LANHU_COOKIE', 'Machine') }; $env:LANHU_COOKIE = $cookie; & node dist/index.js"]
```

修改 MCP 配置或用户环境变量后，需要重启 Codex 桌面端。

## MCP 工具

- `lanhu_parse_url`：解析蓝湖链接。
- `lanhu_list_project_images`：读取项目画板列表，不落盘。
- `lanhu_get_design_context`：生成本地上下文与缩略图资源。

默认产物目录：

```text
.lanhu-mcp.local/runs/{timestamp}-{pidShort}/
├── context.json
├── context.md
└── images/
```

## 多 Agent 协作入口

新用户或新 AI Agent 接手前，按顺序阅读：

1. `README.md`
2. `AGENTS.md`
3. `docs/PROJECT.md`
4. `docs/STATUS.md`
5. `docs/ROADMAP.md`
6. `docs/HANDOFF.md`
7. `docs/DECISIONS.md`
8. `docs/CODE_STANDARDS.md`

每次阶段性开发结束前，需要：

- 跑 `npm run typecheck`、`npm test`、`npm run build`。
- 更新 `docs/STATUS.md` 和 `docs/HANDOFF.md`。
- 如果变更影响路线或架构，更新 `docs/ROADMAP.md` 或 `docs/DECISIONS.md`。
- 如果出现新的建议，先按项目第一原则评估；不冲突且能提升蓝湖读取、设计理解、资源准备、还原质量或协作效率的建议，写入对应文档。
- 使用中文 Conventional Commits 提交，例如 `feat: 增强蓝湖画板规范化逻辑`。

已有本地仓库恢复工作时：

```bash
git status --short --branch
git pull --ff-only
npm install
npm run typecheck
npm test
npm run build
```

拉取后重新阅读 `AGENTS.md`、`docs/STATUS.md`、`docs/HANDOFF.md`、`docs/ROADMAP.md`、`docs/DECISIONS.md`，再继续开发。

## 安全边界

- 不提交真实 Cookie、Token、账号信息。
- 不打印、不保存、不写入 `LANHU_COOKIE`。
- `.lanhu-mcp.local/`、`dist/`、`node_modules/`、`work/`、`outputs/` 不提交。
- V1 不做任何蓝湖写操作。
