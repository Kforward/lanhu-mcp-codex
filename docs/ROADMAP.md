# Roadmap

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

## V1.1：上下文质量增强

目标：让 `context.md` 对后续前端实现更有用。

- 增强 `src/core/lanhu-api.ts` 的字段规范化，适配更多真实蓝湖响应。
- 在 `context.md` 中加入画板排序、尺寸、资源 URL、选中设计图提示。
- 增加真实响应 fixture，覆盖更多字段别名。
- 保持工具层不新增重复解析逻辑。

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

## 暂缓

- 自动登录蓝湖。
- 读取浏览器 Cookie 或 LocalStorage。
- 浏览器自动化兜底。
- 蓝湖写操作、上传、修改、删除。
- npm 包发布。
