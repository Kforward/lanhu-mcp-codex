import { describe, expect, it } from "vitest";
import { parseLanhuUrl, requireProjectParams } from "../src/core/url.js";

describe("parseLanhuUrl", () => {
  it("parses project stage links", () => {
    const parsed = parseLanhuUrl(
      "https://lanhuapp.com/web/#/item/project/stage?tid=team-1&pid=project-1"
    );

    expect(parsed.route).toBe("/item/project/stage");
    expect(parsed.pid).toBe("project-1");
    expect(parsed.tid).toBe("team-1");
    expect(parsed.rawQuery).toMatchObject({
      pid: "project-1",
      tid: "team-1"
    });
  });

  it("parses product links with design and Axure metadata", () => {
    const parsed = parseLanhuUrl(
      "https://lanhuapp.com/web/#/item/project/product?pid=p1&image_id=img1&tid=t1&versionId=v1&docId=d1&docType=axure&pageId=page1&parentId=parent1"
    );

    expect(parsed.route).toBe("/item/project/product");
    expect(parsed.pid).toBe("p1");
    expect(parsed.tid).toBe("t1");
    expect(parsed.imageId).toBe("img1");
    expect(parsed.versionId).toBe("v1");
    expect(parsed.docId).toBe("d1");
    expect(parsed.docType).toBe("axure");
    expect(parsed.pageId).toBe("page1");
    expect(parsed.parentId).toBe("parent1");
  });

  it("supports detailDetach project_id aliases", () => {
    const parsed = parseLanhuUrl(
      "https://lanhuapp.com/web/#/item/project/detailDetach?team_id=t1&project_id=p1&imageId=img1"
    );

    expect(parsed.route).toBe("/item/project/detailDetach");
    expect(parsed.pid).toBe("p1");
    expect(parsed.tid).toBe("t1");
    expect(parsed.imageId).toBe("img1");
  });

  it("throws when project params are incomplete", () => {
    expect(() => requireProjectParams({ pid: "p1" })).toThrow(/pid\/tid/);
  });
});
