import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateDesignContext } from "../src/core/context.js";
import type { LanhuHttpClient } from "../src/core/http.js";
import type { DesignContext, LanhuParsedUrl, LanhuProjectImage } from "../src/types.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { force: true, recursive: true })));
  tempDirs.length = 0;
});

describe("generateDesignContext", () => {
  it("writes context files and downloads available thumbnails", async () => {
    const outputDir = await mkdtemp(path.join(os.tmpdir(), "lanhu-mcp-test-"));
    tempDirs.push(outputDir);

    const parsed: LanhuParsedUrl = {
      originalUrl: "https://lanhuapp.com/web/#/item/project/product?pid=p1&tid=t1&docType=axure",
      route: "/item/project/product",
      pid: "p1",
      tid: "t1",
      docType: "axure",
      rawQuery: {
        pid: "p1",
        tid: "t1",
        docType: "axure"
      }
    };
    const images: LanhuProjectImage[] = [
      {
        id: "img-1",
        name: "B01 留资页",
        width: 100,
        height: 50,
        thumbnailUrl: "https://assets.lanhuapp.com/mock.png",
        raw: {}
      },
      {
        id: "img-2",
        name: "B02 无图",
        raw: {}
      }
    ];
    const http = {
      getBinary: async () => ({
        bytes: createPngHeader(400, 200),
        contentType: "image/png"
      })
    } as unknown as LanhuHttpClient;

    const result = await generateDesignContext({
      sourceUrl: parsed.originalUrl,
      parsed,
      project: { title: "3.3.1落地页", raw: {} },
      images,
      outputDir,
      includeImages: true,
      request: {
        targetImageName: "B01",
        targetDescription: "只实现咨询输入卡片",
        targetRegion: {
          x: 12,
          y: 24,
          width: 200,
          height: 88,
          coordinateSpace: "api"
        }
      },
      http
    });

    expect(result.summary.imageCount).toBe(2);
    expect(result.summary.downloadedImageCount).toBe(1);
    expect(result.summary.schemaVersion).toBe("1.1.1");
    expect(result.summary.selectedImageId).toBe("img-1");
    expect(result.summary.selectedImageName).toBe("B01 留资页");
    expect(result.warnings).toContain("当前链接包含 docType=axure；V1 仅记录该信息，暂不做 Axure/PRD 深度解析。");
    expect(result.warnings.some((warning) => warning.includes("没有可下载的缩略图 URL"))).toBe(true);

    const contextJson = JSON.parse(await readFile(result.contextJsonPath, "utf8")) as DesignContext;
    const contextMarkdown = await readFile(result.contextMarkdownPath, "utf8");

    expect(contextJson.schema.schemaVersion).toBe("1.1.1");
    expect(contextJson.schema.capabilities.supportsTargetRegion).toBe(true);
    expect(contextJson.request.targetDescription).toBe("只实现咨询输入卡片");
    expect(contextJson.images[0]?.localImagePath).toMatch(/\.png$/);
    expect(contextJson.images[0]?.localImage?.pixelSize).toEqual({ width: 400, height: 200 });
    expect(contextJson.images[0]?.localImage?.apiToPixelScale).toEqual({ x: 4, y: 4 });
    expect(contextJson.restoration.pages[0]?.role).toBe("lead_capture");
    expect(contextJson.restoration.pages[0]?.isSelected).toBe(true);
    expect(contextJson.restoration.targetFocus).toMatchObject({
      selectedImageId: "img-1",
      selectedImageName: "B01 留资页",
      source: "explicit-image-name"
    });
    expect(contextJson.restoration.targetFocus.component?.region).toMatchObject({
      x: 12,
      y: 24,
      width: 200,
      height: 88,
      coordinateSpace: "api"
    });
    expect(contextJson.restoration.implementationGuide.recommendedOrder).toEqual(["img-1", "img-2"]);
    expect(contextJson.restoration.implementationGuide.businessImplementationChecklist[0]).toContain("组件级任务");
    expect(contextMarkdown).toContain("# 3.3.1落地页");
    expect(contextMarkdown).toContain("## Context Schema");
    expect(contextMarkdown).toContain("## 代码还原目标");
    expect(contextMarkdown).toContain("## 目标聚焦");
    expect(contextMarkdown).toContain("## 业务落地检查清单");
    expect(contextMarkdown).toContain("本地像素：400x200");
    expect(contextMarkdown).toContain("API 到像素倍率：4x4");
    expect(contextMarkdown).toContain("## 页面角色推断");
    expect(contextMarkdown).toContain("## 推荐实现顺序");
    expect(contextMarkdown).toContain("B01 留资页");
  });
});

function createPngHeader(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}
