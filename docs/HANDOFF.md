# Handoff

## 当前分支

- 分支：`main`
- 远程：`git@github.com:Kforward/lanhu-mcp-codex.git`

## 当前状态

项目已完成 V1 最小功能区，并开始推进 V1.1 代码还原上下文增强。

最近确认：

- `npm run typecheck` 通过。
- `npm test` 通过。
- `npm run build` 通过。
- MCP stdio smoke test 通过。
- 真实蓝湖接口验收通过：项目 `3.3.1落地页` 读取到 8 个画板并下载 8 张缩略图。
- V1.1 已新增 `restoration` 输出：页面角色推断、推荐实现顺序、页面流程推断、Codex 实现指引。
- V1.1 真实 context 已重新生成并检查：推荐顺序为 B01/B02 留资页 -> B04 loading -> B03 支付页 -> 头像素材页。
- 当前文档已对齐最新下一步建议：优先做 V1.1 E2E 页面还原验证，并把所有新建议按第一原则评估后沉淀进文档。
- 首轮 E2E 页面还原验证已完成：`B01留资页-用户未登录（有搜索词）` 可以低保真还原，缺口报告见 `docs/e2e/B01_RESTORATION_VALIDATION.md`。

## 接手步骤

首次接手：

```bash
git clone git@github.com:Kforward/lanhu-mcp-codex.git
cd lanhu-mcp-codex
npm install
npm run build
npm test
```

已有本地仓库恢复工作：

```bash
git status --short --branch
git pull --ff-only
npm install
npm run typecheck
npm test
npm run build
```

拉取最新代码后必须重新阅读：

1. `AGENTS.md`
2. `docs/STATUS.md`
3. `docs/HANDOFF.md`
4. `docs/ROADMAP.md`
5. `docs/DECISIONS.md`
6. `docs/CODE_STANDARDS.md`

配置 `LANHU_COOKIE` 后可调用：

```text
lanhu_parse_url
lanhu_list_project_images
lanhu_get_design_context
```

## 下一步推荐任务

1. 实现 V1.1.1 上下文可消费性补强：schema/capability 信息、MCP 重启提示、目标画板聚焦、图片真实尺寸和缩放比例。
2. 补充组件级还原聚焦能力设计，至少支持 `targetDescription` 或 `targetRegion`，用于“整图里只实现一个小组件”的场景。
3. 给上述能力补测试，确保 `context.md/json` 能明确暴露还原上下文能力。
4. 使用 B01 画板直链重新验收：`detailDetach?type=image&...&image_id=ec806cda-67ac-4f8b-98ca-86ac19ffa280`。
5. 推进 V1.2 单图详情增强，研究 `image_id` 单图详情 API 的更多字段。
6. 给蓝湖真实响应建立脱敏 fixture，扩展规范化测试。
7. 根据单图详情结果继续评估切图资源、Design Tokens 或还原提示词。

## 已知风险

- 蓝湖 Web API 可能变化，响应字段需要持续适配。
- 缩略图和资源 URL 可能受权限或防盗链影响。
- `LANHU_COOKIE` 过期会导致 403/418，需要重新获取。
- PowerShell 5.1 读取无 BOM UTF-8 时可能乱码，读取中文文件请显式 `-Encoding UTF8`。
- Codex MCP 长进程可能在代码更新后继续使用旧构建；如果生成的 context 缺少预期字段，先重启 MCP/Codex 再验收。

## 阶段结束清单

每个 Agent 完成阶段任务后：

- 更新 `docs/STATUS.md`。
- 更新本文件的当前状态和下一步推荐任务。
- 如有架构/范围决策，更新 `docs/DECISIONS.md`。
- 如有路线或优先级变化，更新 `docs/ROADMAP.md`。
- 如出现新的建议，先按第一原则“辅助 Codex 基于蓝湖设计文稿进行代码还原”评估；不冲突且有价值的建议必须写入对应文档。
- 跑 typecheck/test/build。
- 使用中文 Conventional Commit 提交并推送。
