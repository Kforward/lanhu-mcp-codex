# 当前进度

## 当前状态

V1 最小功能区已实现，并通过本地类型检查、单元测试、构建、MCP stdio smoke test 和真实蓝湖接口验收。当前正在推进 V1.1：把蓝湖上下文升级为辅助 Codex 进行代码还原的实现上下文。

2026-07-01 已完成 V1.1 首轮 E2E 页面还原验证：当前 MCP 产物可以支撑低保真结构还原，但距离稳定高质量页面还原仍缺目标画板聚焦、图片尺寸映射、图层/文本、切图资源和 Design Tokens。

2026-07-06 已完成 V1.1.1 上下文可消费性补强的代码实现、本地验证和真实 B01 直链验收：context 输出 schema/capability、目标画板聚焦、组件级目标描述/区域、图片真实像素尺寸、API 到像素倍率、业务落地检查清单和 MCP 重启提示。

## 已完成

- 初始化项目内私有 npm/TypeScript MCP 包。
- 配置 `build`、`dev`、`test`、`typecheck` 脚本。
- 建立 `.gitignore`，忽略 `.lanhu-mcp.local/`、`dist/`、`node_modules/`。
- 实现 `lanhu_parse_url`、`lanhu_list_project_images`、`lanhu_get_design_context` 三个 MCP 工具。
- 实现蓝湖 URL 解析、只读 HTTP client、项目图片 API、单图详情 API、项目信息 API。
- 实现本地产物目录、缩略图下载、`context.md` 和 `context.json` 生成。
- 完成项目简介和代码规范文档。
- `npm run typecheck` 已通过。
- `npm test` 已通过：3 个测试文件，9 个测试。
- `npm run build` 已通过。
- MCP stdio smoke test 已通过：成功列出 3 个工具并调用 `lanhu_parse_url`。
- 真实蓝湖接口验收已通过：项目 `3.3.1落地页` 读取到 8 个画板，成功下载 8 张缩略图，warning 数量为 0。
- 新增根目录 `README.md` 和 `AGENTS.md`，作为新用户/新 Agent 的入口。
- 新增 `docs/ROADMAP.md`、`docs/HANDOFF.md`、`docs/DECISIONS.md`，用于沉淀路线、交接和关键决策。
- 强化恢复工作流程：每次新任务、切换端、切换 Agent 或拉取最新代码后，必须重新阅读状态、交接、路线和决策文档。
- 新增 `src/core/restoration.ts`，输出页面角色、流程关系、推荐实现顺序、Codex 实现指引。
- `context.md` 已从画板清单升级为面向代码还原的任务书结构。
- `context.json` 新增 `restoration` 结构，供后续 Agent 或程序消费。
- 推荐实现顺序已按角色和 B 编号排序，例如 B01/B02 留资页会按编号自然排列。
- 测试扩展到 5 个测试文件，14 个测试。
- 真实蓝湖链接已重新生成 V1.1 context，确认 Markdown 包含代码还原目标、页面角色推断、推荐实现顺序和本地资源清单。
- 已将“新建议必须围绕第一原则评估并沉淀进文档”的流程写入入口、状态、路线、交接和决策文档。
- 已将当前下一步从泛化人工检查收敛为 V1.1 E2E 页面还原验证，用真实还原缺口反推后续优先级。
- 完成 `B01留资页-用户未登录（有搜索词）` 首轮 E2E 页面还原验证，报告见 `docs/e2e/B01_RESTORATION_VALIDATION.md`。
- 本地创建 `work/e2e-b01-playground/` 作为验证 playground；该目录不提交，用于避免把蓝湖缩略图和还原页面资产写入版本库。
- V1.1.1 已新增 `context.schema`、`context.request`、`restoration.targetFocus` 和 `implementationGuide.businessImplementationChecklist`。
- `lanhu_get_design_context` 已支持 `targetImageId`、`targetImageName`、`targetDescription`、`targetRegion`，用于整页或组件级还原聚焦。
- 缩略图下载会记录本地文件大小、真实像素尺寸，并在 context 中给出 API 画板尺寸到本地像素尺寸的缩放比例。
- 新增图片元数据解析基础能力，当前支持 PNG/JPEG/WebP 尺寸读取，失败时不阻断 context 生成。
- V1.1.1 本地验证已通过：`npm run typecheck`、`npm test`、`npm run build`、`git diff --check`。
- 真实 B01 画板直链验收已通过：项目 `3.3.1落地页` 读取 8 个画板、下载 8 张缩略图、warning 数量为 0，选中 `B01留资页-用户未登录（有搜索词）`，schemaVersion 为 `1.1.1`。

## 下一步

- 推进 V1.2 单图详情增强，优先寻找图层、文本、标注和切图入口。
- 评估 V1.5 还原提示词输出：基于当前 `restoration` 和 `targetFocus` 生成可复制的 Codex 实现 Prompt，降低跨 Agent 消费差异。
- 若后续修改 MCP 或重新构建，需要重启 Codex/MCP 后复跑 B01 直链验收，确认运行态使用最新构建。
- 根据真实项目响应字段继续调整规范化逻辑，优先增强 `src/core/lanhu-api.ts` 和 `src/core/restoration.ts`，不要在工具层补重复逻辑。
- 每个后续 Agent 结束阶段任务时，必须同步更新 `docs/STATUS.md` 和 `docs/HANDOFF.md`。
- 如果另一端 Agent 有新的架构思考或路线变化，必须同步写入 `docs/DECISIONS.md` 或 `docs/ROADMAP.md`，以便其他端拉取后重新读取。
- 每次出现新的建议，先以第一原则“辅助 Codex 基于蓝湖设计文稿进行代码还原”为中心评估；不冲突且有价值的建议必须补充进 `ROADMAP/HANDOFF/DECISIONS/STATUS` 中合适的位置。

## 风险记录

- 蓝湖 Web API 不是官方稳定 OpenAPI，字段名和响应结构可能变化。
- 某些缩略图资源可能有防盗链或权限限制；V1 仅记录 warning，不使用浏览器兜底。
- 当前 `docType=axure` 只记录，不做 PRD/Axure 深度解析。
- Codex MCP 长进程可能在代码更新后继续使用旧构建；context 已输出重启提示，但真实验收前仍需要重启 MCP/Codex。
- `targetRegion` 当前只记录人工输入区域，不做自动裁剪；后续若获得图层或坐标 API，再升级为更精确的组件级上下文。
