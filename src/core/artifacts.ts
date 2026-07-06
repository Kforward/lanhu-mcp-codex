import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LanhuHttpClient } from "./http.js";
import { readImageSize } from "./image-metadata.js";
import type { DownloadedImage, LanhuProjectImage } from "../types.js";

export interface RunArtifacts {
  runDirectory: string;
  contextJsonPath: string;
  contextMarkdownPath: string;
  imagesDirectory: string;
}

export interface DownloadImagesResult {
  images: DownloadedImage[];
  warnings: string[];
}

export async function createRunArtifacts(options: { pid: string; outputDir?: string; now?: Date }): Promise<RunArtifacts> {
  const runDirectory = options.outputDir
    ? path.resolve(options.outputDir)
    : path.resolve(
        process.cwd(),
        ".lanhu-mcp.local",
        "runs",
        `${formatTimestamp(options.now ?? new Date())}-${shortId(options.pid)}`
      );
  const imagesDirectory = path.join(runDirectory, "images");

  await mkdir(imagesDirectory, { recursive: true });

  return {
    runDirectory,
    contextJsonPath: path.join(runDirectory, "context.json"),
    contextMarkdownPath: path.join(runDirectory, "context.md"),
    imagesDirectory
  };
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await writeFile(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

export async function downloadImageAssets(options: {
  images: LanhuProjectImage[];
  imagesDirectory: string;
  http: LanhuHttpClient;
}): Promise<DownloadImagesResult> {
  const downloaded: DownloadedImage[] = [];
  const warnings: string[] = [];

  for (const [index, image] of options.images.entries()) {
    if (!image.thumbnailUrl) {
      warnings.push(`画板 "${image.name}" 没有可下载的缩略图 URL。`);
      continue;
    }

    try {
      const response = await options.http.getBinary(image.thumbnailUrl);
      const extension = extensionFromContentType(response.contentType) ?? extensionFromUrl(image.thumbnailUrl) ?? ".bin";
      const fileName = `${String(index + 1).padStart(2, "0")}-${sanitizeFilename(image.name)}-${shortId(image.id)}${extension}`;
      const filePath = path.join(options.imagesDirectory, fileName);

      await writeFile(filePath, response.bytes);
      downloaded.push({
        imageId: image.id,
        imageName: image.name,
        sourceUrl: image.thumbnailUrl,
        path: filePath,
        contentType: response.contentType,
        fileSizeBytes: response.bytes.length,
        pixelSize: readImageSize(response.bytes, response.contentType, image.thumbnailUrl)
      });
    } catch (error) {
      warnings.push(`画板 "${image.name}" 缩略图下载失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { images: downloaded, warnings };
}

export function sanitizeFilename(value: string): string {
  const sanitized = value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized.slice(0, 80) || "untitled";
}

export function shortId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "unknown";
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function extensionFromContentType(contentType?: string): string | undefined {
  if (!contentType) {
    return undefined;
  }

  if (contentType.includes("image/png")) {
    return ".png";
  }
  if (contentType.includes("image/jpeg")) {
    return ".jpg";
  }
  if (contentType.includes("image/webp")) {
    return ".webp";
  }
  if (contentType.includes("image/svg")) {
    return ".svg";
  }
  if (contentType.includes("image/gif")) {
    return ".gif";
  }

  return undefined;
}

function extensionFromUrl(urlText: string): string | undefined {
  try {
    const url = new URL(urlText);
    const extension = path.extname(url.pathname);
    return extension || undefined;
  } catch {
    return undefined;
  }
}
