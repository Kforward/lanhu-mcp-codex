# Handoff

## 当前分支

- 分支：`main`
- 远程：`git@github.com:Kforward/lanhu-mcp-codex.git`

## 当前状态

项目已完成 V1 最小功能区，并已推送远程仓库。

最近确认：

- `npm run typecheck` 通过。
- `npm test` 通过。
- `npm run build` 通过。
- MCP stdio smoke test 通过。
- 真实蓝湖接口验收通过：项目 `3.3.1落地页` 读取到 8 个画板并下载 8 张缩略图。

## 接手步骤

```bash
git clone git@github.com:Kforward/lanhu-mcp-codex.git
cd lanhu-mcp-codex
npm install
npm run build
npm test
```

配置 `LANHU_COOKIE` 后可调用：

```text
lanhu_parse_url
lanhu_list_project_images
lanhu_get_design_context
```

## 下一步推荐任务

1. 补根目录或 docs 中的真实 MCP 调用示例。
2. 增强 `context.md` 输出，让前端实现 Agent 更容易消费。
3. 给蓝湖真实响应建立脱敏 fixture，扩展规范化测试。
4. 研究 `image_id` 单图详情 API 的更多字段。

## 已知风险

- 蓝湖 Web API 可能变化，响应字段需要持续适配。
- 缩略图和资源 URL 可能受权限或防盗链影响。
- `LANHU_COOKIE` 过期会导致 403/418，需要重新获取。
- PowerShell 5.1 读取无 BOM UTF-8 时可能乱码，读取中文文件请显式 `-Encoding UTF8`。

## 阶段结束清单

每个 Agent 完成阶段任务后：

- 更新 `docs/STATUS.md`。
- 更新本文件的当前状态和下一步推荐任务。
- 如有架构/范围决策，更新 `docs/DECISIONS.md`。
- 跑 typecheck/test/build。
- 使用中文 Conventional Commit 提交并推送。
