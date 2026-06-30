# Agent 协作协议

本文件用于让不同客户端、不同 AI Agent 在不共享聊天记录的情况下继续协同开发。

## 接手顺序

每个 Agent 开始工作前必须先读：

1. `README.md`
2. `docs/PROJECT.md`
3. `docs/STATUS.md`
4. `docs/ROADMAP.md`
5. `docs/HANDOFF.md`
6. `docs/DECISIONS.md`
7. `docs/CODE_STANDARDS.md`

然后执行：

```bash
git status --short --branch
git log --oneline -5
```

## 恢复工作流程

每次开始新任务、切换客户端、切换 Agent、或执行 `git pull` 获取他人最新提交后，必须重新建立项目上下文：

1. 执行 `git pull --ff-only` 获取远程最新内容；如果已有本地未提交改动，先读 `git status --short --branch` 并保护本地改动，不要强行覆盖。
2. 重新阅读 `docs/STATUS.md`、`docs/HANDOFF.md`、`docs/ROADMAP.md`、`docs/DECISIONS.md`。
3. 对照最近 5 条 commit，确认文档描述和 git 历史一致。
4. 在继续开发前，先用简短中文总结当前状态、最新变化、下一步最小任务。

## 开发原则

- 默认使用中文沟通和中文文档。
- 修改代码前先简短说明计划。
- 不要擅自删除文件。
- 做 review 时优先指出 bug、风险和测试缺口。
- 如果任务不明确，先做合理假设，不要一直反问。
- 在 Windows PowerShell 中读取/搜索文本时显式使用 UTF-8，例如 `Get-Content -Encoding UTF8`、`Select-String -Encoding UTF8`。

## 代码约束

- 严格遵守 `docs/CODE_STANDARDS.md`。
- 工具层只做 MCP 参数校验与业务编排。
- URL 解析、HTTP 请求、文件产物、context 生成等基础能力只能在 `src/core/*` 实现。
- 第二处出现相似逻辑时，必须提取复用函数。
- 不提交真实 Cookie、Token、账号数据或蓝湖私密响应。

## 阶段结束要求

每个 Agent 结束阶段前必须：

1. 跑 `npm run typecheck`。
2. 跑 `npm test`。
3. 跑 `npm run build`。
4. 更新 `docs/STATUS.md`，写清楚已完成、当前状态、下一步。
5. 更新 `docs/HANDOFF.md`，写清楚接手步骤、已验证命令、已知风险、下一步推荐任务。
6. 如果新增/改变架构决策，更新 `docs/DECISIONS.md`。
7. 如果改变路线或优先级，更新 `docs/ROADMAP.md`。
8. 使用中文 Conventional Commits 提交并推送。

推荐提交格式：

```text
feat: 增加蓝湖单图详情上下文
fix: 修复画板名称字段兼容问题
docs: 补充多端协作接手文档
test: 增加蓝湖接口响应规范化测试
refactor: 提取资源下载复用函数
```

## 当前项目重点

当前项目目标不是做全能蓝湖 MCP，而是做一个 API-only、只读、适合 Codex 的蓝湖上下文生成工具。任何新功能都应优先服务：

- 更稳定地读取蓝湖设计上下文。
- 更清晰地输出给 AI Agent 使用。
- 更安全地处理认证和本地产物。
- 更容易被多人多端接手迭代。
