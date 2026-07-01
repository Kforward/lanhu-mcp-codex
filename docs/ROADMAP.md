# Roadmap

## 路线评估规则

所有新建议、路线变化或功能扩展，都必须先围绕项目第一原则评估：

> 辅助 Codex 基于蓝湖设计文稿进行代码还原。

不冲突且能提升蓝湖读取、设计理解、资源准备、还原质量或协作效率的建议，补充进本 Roadmap 或 `docs/STATUS.md`、`docs/HANDOFF.md`、`docs/DECISIONS.md` 的合适位置；与第一原则无关或会偏离为全能蓝湖平台工具的建议，进入暂缓或拒绝。

## 已完成：V1 最小功能区

- 项目内私有 TypeScript MCP 包。
- stdio MCP 接入。
- `LANHU_COOKIE` 环境变量认证。
- `lanhu_parse_url`。
- `lanhu_list_project_images`。
- `lanhu_get_design_context`。
- 本地 `context.md/context.json/images` 产物。
- 单元测试、构建、真实蓝湖接口验收。
- 多 Agent 协作文档基础。

## V1.1：代码还原上下文增强

目标：让 `context.md/context.json` 从画板清单升级成辅助 Codex 还原页面的实现上下文。

- 新增 `src/core/restoration.ts`，根据画板名称和资源路径轻量推断页面角色、流程关系和实现建议。
- 在 `context.md` 中加入代码还原目标、Codex 实现指引、页面角色推断、推荐实现顺序、页面流程推断、本地资源清单、推断假设与限制。
- 在 `context.json` 中新增 `restoration` 结构，包含 `pages`、`assets`、`implementationGuide`。
- 已覆盖当前蓝湖项目常见角色：留资页、loading 页、支付页、头像/素材页。

## V1.1 后续补强：上下文质量增强

目标：继续增强真实蓝湖响应兼容性和输出质量。

- 先完成 V1.1 E2E 页面还原验证：使用当前 `context.md/context.json/images` 实际让 Codex 还原一个页面，记录缺口。
- 增强 `src/core/lanhu-api.ts` 的字段规范化，适配更多真实蓝湖响应。
- 在 `context.md` 中补充更稳定的画板排序、分组、源 URL、选中设计图提示。
- 增加真实响应 fixture，覆盖更多字段别名。
- 保持工具层不新增重复解析逻辑。

## V1.1 E2E：页面还原验证

目标：验证当前 MCP 产物是否已经能实际辅助 Codex 还原页面，并用缺口反推后续优先级。

最小验证闭环：

1. 使用 `lanhu_get_design_context` 生成最新 context。
2. 选择一个画板作为还原目标，优先选择 `B01留资页-用户未登录（有搜索词）`。
3. 建立最小前端 playground，用当前 `context.md`、`context.json` 和本地缩略图作为输入。
4. 让 Codex 基于上下文还原页面。
5. 人工记录缺口：文本、图层、切图、Design Tokens、布局尺寸、流程说明、资源复用。
6. 将缺口写入 `docs/HANDOFF.md` 和本 Roadmap。

验收标准：

- Codex 能在不重新打开蓝湖网页的情况下，根据 MCP 产物生成可运行页面。
- 能明确判断下一步优先补 `单图详情`、`切图资源`、`Design Tokens` 还是 `还原提示词`。
- 不能把视觉猜测伪装成蓝湖结构化数据。

## V1.2：单图详情增强

目标：让指定 `image_id` 的链接获得更聚焦的上下文。

- 扩展 `lanhu_get_design_context` 的 selected image 输出。
- 优先下载当前设计图预览。
- 如果接口返回图层或标注字段，进行只读规范化。
- 增加单图详情测试 fixture。

## V1.3：切图资源下载

目标：让 AI 实现页面时可以直接引用可用资源。

- 新增或扩展资源下载能力，下载蓝湖标注切图。
- 按 `icon/img/bg` 分类。
- 去重相同资源。
- 在 `context.json` 中记录原始 URL、本地路径、尺寸、类型。

## V1.4：Axure/PRD 只读分析

目标：处理 `docType=axure` 或产品文档链接。

- 探查蓝湖产品文档/原型相关 API。
- 新增 PRD/Axure context 输出。
- 不做浏览器自动化兜底，除非明确进入后续独立计划。

## V1.5：还原提示词输出

目标：让 MCP 直接输出一段面向 Codex 的实现 Prompt，降低不同 Agent 消费 context 的不稳定性。

- 基于 `restoration.implementationGuide` 生成可复制的实现提示词。
- 明确输入文件：`context.md`、`context.json`、目标画板本地图片。
- 明确实现边界：先还原目标页面，缺少 tokens 时记录假设，不臆造蓝湖数据。
- 可作为 E2E 验证后的补强项，不早于 E2E 缺口分析。

## 暂缓

- 自动登录蓝湖。
- 读取浏览器 Cookie 或 LocalStorage。
- 浏览器自动化兜底。
- 蓝湖写操作、上传、修改、删除。
- npm 包发布。
