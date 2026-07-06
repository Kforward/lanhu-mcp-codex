import type { LanhuHttpClient } from "./http.js";
import { buildRestorationContext } from "./restoration.js";
import {
  createRunArtifacts,
  downloadImageAssets,
  writeJsonFile,
  writeTextFile
} from "./artifacts.js";
import { buildLocalImageInfo } from "./image-assets.js";
import type {
  ContextSchemaInfo,
  DesignContext,
  DesignContextRequest,
  DesignContextResult,
  LanhuImageDetail,
  LanhuParsedUrl,
  LanhuProjectImage,
  LanhuProjectInfo
} from "../types.js";

export async function generateDesignContext(options: {
  sourceUrl: string;
  parsed: LanhuParsedUrl;
  project?: LanhuProjectInfo;
  selectedImage?: LanhuImageDetail;
  images: LanhuProjectImage[];
  outputDir?: string;
  includeImages: boolean;
  request?: DesignContextRequest;
  http: LanhuHttpClient;
}): Promise<DesignContextResult> {
  if (!options.parsed.pid) {
    throw new Error("生成上下文需要 pid。");
  }

  const artifacts = await createRunArtifacts({
    pid: options.parsed.pid,
    outputDir: options.outputDir
  });

  const warnings: string[] = [];
  if (options.parsed.docType === "axure") {
    warnings.push("当前链接包含 docType=axure；V1 仅记录该信息，暂不做 Axure/PRD 深度解析。");
  }

  const downloads = options.includeImages
    ? await downloadImageAssets({
        images: options.images,
        imagesDirectory: artifacts.imagesDirectory,
        http: options.http
      })
    : { images: [], warnings: ["includeImages=false，已跳过缩略图下载。"] };

  warnings.push(...downloads.warnings);

  const localPathByImageId = new Map(downloads.images.map((image) => [image.imageId, image.path]));
  const downloadedByImageId = new Map(downloads.images.map((image) => [image.imageId, image]));
  const imagesWithLocalPaths = options.images.map((image) => ({
    ...image,
    localImagePath: localPathByImageId.get(image.id),
    localImage: buildLocalImageInfo(image, downloadedByImageId.get(image.id))
  }));
  const restoration = buildRestorationContext({
    parsed: options.parsed,
    selectedImage: options.selectedImage,
    images: imagesWithLocalPaths,
    downloadedImages: downloads.images,
    request: options.request
  });
  warnings.push(...restoration.targetFocus.warnings);

  const schema = buildContextSchema();
  const context: DesignContext = {
    schema,
    generatedAt: new Date().toISOString(),
    sourceUrl: options.sourceUrl,
    parsed: options.parsed,
    request: options.request ?? {},
    project: options.project,
    selectedImage: options.selectedImage,
    images: imagesWithLocalPaths,
    restoration,
    artifacts,
    warnings
  };

  await writeJsonFile(artifacts.contextJsonPath, context);
  await writeTextFile(artifacts.contextMarkdownPath, renderContextMarkdown(context));

  return {
    summary: {
      projectTitle: options.project?.title,
      imageCount: options.images.length,
      downloadedImageCount: downloads.images.length,
      warningCount: warnings.length,
      schemaVersion: schema.schemaVersion,
      selectedImageId: restoration.targetFocus.selectedImageId,
      selectedImageName: restoration.targetFocus.selectedImageName
    },
    contextJsonPath: artifacts.contextJsonPath,
    contextMarkdownPath: artifacts.contextMarkdownPath,
    imagePaths: downloads.images.map((image) => image.path),
    warnings
  };
}

export function renderContextMarkdown(context: DesignContext): string {
  const title = context.project?.title ?? "蓝湖设计上下文";
  const selectedImageLine = context.restoration.targetFocus.selectedImageName
    ? `- 当前目标画板：${context.restoration.targetFocus.selectedImageName} (${context.restoration.targetFocus.selectedImageId ?? "未知 ID"})`
    : context.selectedImage
      ? `- 当前设计图：${context.selectedImage.name ?? context.selectedImage.id ?? context.parsed.imageId ?? "未知"}`
      : "- 当前目标画板：未指定";
  const guide = context.restoration.implementationGuide;

  return [
    `# ${title}`,
    "",
    "## Context Schema",
    "",
    `- schemaVersion：${context.schema.schemaVersion}`,
    `- capabilities：${renderCapabilities(context.schema)}`,
    `- restartHint：${context.schema.restartHint}`,
    "",
    "## 代码还原目标",
    "",
    guide.purpose,
    "",
    "### Codex 实现指引",
    "",
    guide.codexInstructions.map((instruction) => `- ${instruction}`).join("\n"),
    "",
    "### 业务落地检查清单",
    "",
    guide.businessImplementationChecklist.map((item) => `- ${item}`).join("\n"),
    "",
    "## 基本信息",
    "",
    `- 生成时间：${context.generatedAt}`,
    `- 来源链接：${context.sourceUrl}`,
    `- 路由：${context.parsed.route}`,
    `- 项目 ID：${context.parsed.pid ?? "未知"}`,
    `- 团队 ID：${context.parsed.tid ?? "未知"}`,
    selectedImageLine,
    `- 文档类型：${context.parsed.docType ?? "未提供"}`,
    `- 目标来源：${context.restoration.targetFocus.source}`,
    "",
    "## 目标聚焦",
    "",
    renderTargetFocus(context),
    "",
    "## 画板列表",
    "",
    context.images.length === 0
      ? "未从蓝湖接口读取到画板。"
      : context.images.map((image, index) => renderImageLine(image, index)).join("\n"),
    "",
    "## 页面角色推断",
    "",
    context.restoration.pages.length === 0
      ? "暂无可推断页面。"
      : context.restoration.pages.map((page, index) => renderRestorationPageLine(page, index)).join("\n"),
    "",
    "## 推荐实现顺序",
    "",
    renderRecommendedOrder(context),
    "",
    "## 页面流程推断",
    "",
    context.restoration.implementationGuide.pageFlows.length === 0
      ? "暂无可推断流程。"
      : context.restoration.implementationGuide.pageFlows.map(renderFlow).join("\n"),
    "",
    "## 本地资源清单",
    "",
    context.restoration.assets.length === 0
      ? "暂无本地资源。"
      : context.restoration.assets.map((asset, index) => `${index + 1}. ${asset.imageName}：${asset.localPath}`).join("\n"),
    "",
    "## 推断假设与限制",
    "",
    "### 假设",
    "",
    guide.assumptions.map((assumption) => `- ${assumption}`).join("\n"),
    "",
    "### 限制",
    "",
    guide.limitations.map((limitation) => `- ${limitation}`).join("\n"),
    "",
    "## 本地产物",
    "",
    `- context.json：${context.artifacts.contextJsonPath}`,
    `- 缩略图目录：${context.artifacts.imagesDirectory}`,
    "",
    "## Warnings",
    "",
    context.warnings.length === 0 ? "无。" : context.warnings.map((warning) => `- ${warning}`).join("\n"),
    ""
  ].join("\n");
}

function renderImageLine(image: DesignContext["images"][number], index: number): string {
  const size = image.width || image.height ? `${image.width ?? "?"}x${image.height ?? "?"}` : "尺寸未知";
  const localImage = image.localImage;
  const pixel = localImage?.pixelSize ? `，本地像素：${localImage.pixelSize.width}x${localImage.pixelSize.height}` : "";
  const scale = localImage?.apiToPixelScale
    ? `，API 到像素倍率：${localImage.apiToPixelScale.x ?? "?"}x${localImage.apiToPixelScale.y ?? "?"}`
    : "";
  const local = image.localImagePath ? `，本地缩略图：${image.localImagePath}` : "";
  return `${index + 1}. ${image.name} (${image.id})，${size}${pixel}${scale}${local}`;
}

function renderRestorationPageLine(
  page: DesignContext["restoration"]["pages"][number],
  index: number
): string {
  const selected = page.isSelected ? "，当前选中" : "";
  return `${index + 1}. ${page.name} (${page.role}${selected})：${page.implementationHint}`;
}

function renderRecommendedOrder(context: DesignContext): string {
  const byId = new Map(context.restoration.pages.map((page) => [page.id, page]));
  const lines = context.restoration.implementationGuide.recommendedOrder
    .map((id, index) => {
      const page = byId.get(id);
      return page ? `${index + 1}. ${page.name} (${page.role})` : `${index + 1}. ${id}`;
    });

  return lines.length > 0 ? lines.join("\n") : "暂无推荐顺序。";
}

function renderFlow(flow: DesignContext["restoration"]["implementationGuide"]["pageFlows"][number]): string {
  return `- ${flow.summary} 置信度：${flow.confidence}。页面 ID：${flow.orderedPageIds.join(" -> ")}`;
}

function buildContextSchema(): ContextSchemaInfo {
  return {
    schemaVersion: "1.1.1",
    capabilities: {
      hasRestorationContext: true,
      supportsTargetImageFocus: true,
      supportsTargetDescription: true,
      supportsTargetRegion: true,
      includesImageDimensions: true,
      includesBusinessImplementationGuide: true,
      requiresMcpRestartAfterBuild: true
    },
    restartHint: "MCP 服务是长进程；更新代码、build 或修改环境变量后，请重启 Codex/MCP 再验收 context schema。"
  };
}

function renderCapabilities(schema: ContextSchemaInfo): string {
  return Object.entries(schema.capabilities)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .join(", ");
}

function renderTargetFocus(context: DesignContext): string {
  const focus = context.restoration.targetFocus;
  const lines = [
    `- 目标来源：${focus.source}`,
    `- 选中画板：${focus.selectedImageName ? `${focus.selectedImageName} (${focus.selectedImageId ?? "未知 ID"})` : "未匹配"}`,
    `- 页面角色：${focus.selectedPageRole ?? "未知"}`
  ];

  if (focus.component?.description) {
    lines.push(`- 组件描述：${focus.component.description}`);
  }
  if (focus.component?.region) {
    const region = focus.component.region;
    lines.push(`- 组件区域：x=${region.x}, y=${region.y}, width=${region.width}, height=${region.height}, coordinateSpace=${region.coordinateSpace ?? "unknown"}`);
  }
  if (focus.component?.instruction) {
    lines.push(`- 组件实现提示：${focus.component.instruction}`);
  }
  if (focus.warnings.length > 0) {
    lines.push(...focus.warnings.map((warning) => `- 聚焦 warning：${warning}`));
  }

  return lines.join("\n");
}
