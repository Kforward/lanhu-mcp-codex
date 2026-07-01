import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateDesignContext } from "../src/core/context.js";
import type { LanhuHttpClient } from "../src/core/http.js";
import type { LanhuParsedUrl, LanhuProjectImage } from "../src/types.js";

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
        thumbnailUrl: "https://assets.lanhuapp.com/mock.webp",
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
        bytes: Buffer.from("fake-image"),
        contentType: "image/webp"
      })
    } as unknown as LanhuHttpClient;

    const result = await generateDesignContext({
      sourceUrl: parsed.originalUrl,
      parsed,
      project: { title: "3.3.1落地页", raw: {} },
      images,
      outputDir,
      includeImages: true,
      http
    });

    expect(result.summary.imageCount).toBe(2);
    expect(result.summary.downloadedImageCount).toBe(1);
    expect(result.warnings).toContain("当前链接包含 docType=axure；V1 仅记录该信息，暂不做 Axure/PRD 深度解析。");
    expect(result.warnings.some((warning) => warning.includes("没有可下载的缩略图 URL"))).toBe(true);

    const contextJson = JSON.parse(await readFile(result.contextJsonPath, "utf8")) as {
      images: Array<{ localImagePath?: string }>;
      restoration: {
        pages: Array<{ role: string; implementationHint: string }>;
        implementationGuide: { recommendedOrder: string[] };
      };
    };
    const contextMarkdown = await readFile(result.contextMarkdownPath, "utf8");

    expect(contextJson.images[0]?.localImagePath).toMatch(/\.webp$/);
    expect(contextJson.restoration.pages[0]?.role).toBe("lead_capture");
    expect(contextJson.restoration.implementationGuide.recommendedOrder).toEqual(["img-1", "img-2"]);
    expect(contextMarkdown).toContain("# 3.3.1落地页");
    expect(contextMarkdown).toContain("## 代码还原目标");
    expect(contextMarkdown).toContain("## 页面角色推断");
    expect(contextMarkdown).toContain("## 推荐实现顺序");
    expect(contextMarkdown).toContain("B01 留资页");
  });
});
