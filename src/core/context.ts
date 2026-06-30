import type { LanhuHttpClient } from "./http.js";
import {
  createRunArtifacts,
  downloadImageAssets,
  writeJsonFile,
  writeTextFile
} from "./artifacts.js";
import type {
  DesignContext,
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
  const context: DesignContext = {
    generatedAt: new Date().toISOString(),
    sourceUrl: options.sourceUrl,
    parsed: options.parsed,
    project: options.project,
    selectedImage: options.selectedImage,
    images: options.images.map((image) => ({
      ...image,
      localImagePath: localPathByImageId.get(image.id)
    })),
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
      warningCount: warnings.length
    },
    contextJsonPath: artifacts.contextJsonPath,
    contextMarkdownPath: artifacts.contextMarkdownPath,
    imagePaths: downloads.images.map((image) => image.path),
    warnings
  };
}

export function renderContextMarkdown(context: DesignContext): string {
  const title = context.project?.title ?? "蓝湖设计上下文";
  const selectedImageLine = context.selectedImage
    ? `- 当前设计图：${context.selectedImage.name ?? context.selectedImage.id ?? context.parsed.imageId ?? "未知"}`
    : "- 当前设计图：未指定";

  return [
    `# ${title}`,
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
    "",
    "## 画板列表",
    "",
    context.images.length === 0
      ? "未从蓝湖接口读取到画板。"
      : context.images.map((image, index) => renderImageLine(image, index)).join("\n"),
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

function renderImageLine(image: LanhuProjectImage & { localImagePath?: string }, index: number): string {
  const size = image.width || image.height ? `${image.width ?? "?"}x${image.height ?? "?"}` : "尺寸未知";
  const local = image.localImagePath ? `，本地缩略图：${image.localImagePath}` : "";
  return `${index + 1}. ${image.name} (${image.id})，${size}${local}`;
}
