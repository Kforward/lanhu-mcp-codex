import { describe, expect, it } from "vitest";
import { buildRestorationContext } from "../src/core/restoration.js";
import type { LanhuParsedUrl, LanhuProjectImage } from "../src/types.js";

describe("buildRestorationContext", () => {
  it("infers restoration roles and a main flow from Lanhu board names", () => {
    const parsed: LanhuParsedUrl = {
      originalUrl: "https://lanhuapp.com/web/#/item/project/stage?pid=p1&tid=t1",
      route: "/item/project/stage",
      pid: "p1",
      tid: "t1",
      rawQuery: {
        pid: "p1",
        tid: "t1"
      }
    };
    const images: LanhuProjectImage[] = [
      { id: "b04", name: "B04 跳转支付loading页", raw: {} },
      { id: "b02", name: "B02留资页-用户未登录（无搜索词）", raw: {} },
      { id: "avatar", name: "头像", raw: {} },
      { id: "b03", name: "B03 支付页-默认无底部内容", raw: {} }
    ];

    const context = buildRestorationContext({
      parsed,
      images,
      downloadedImages: []
    });

    expect(context.pages.map((page) => [page.id, page.role])).toEqual([
      ["b04", "loading"],
      ["b02", "lead_capture"],
      ["avatar", "asset_sheet"],
      ["b03", "payment"]
    ]);
    expect(context.implementationGuide.recommendedOrder).toEqual(["b02", "b04", "b03", "avatar"]);
    expect(context.implementationGuide.pageFlows[0]).toMatchObject({
      confidence: "medium",
      orderedPageIds: ["b02", "b04", "b03"]
    });
  });

  it("sorts pages with the same role by B number before generating implementation order", () => {
    const parsed: LanhuParsedUrl = {
      originalUrl: "https://lanhuapp.com/web/#/item/project/stage?pid=p1&tid=t1",
      route: "/item/project/stage",
      pid: "p1",
      tid: "t1",
      rawQuery: {
        pid: "p1",
        tid: "t1"
      }
    };

    const context = buildRestorationContext({
      parsed,
      images: [
        { id: "b02", name: "B02留资页-用户未登录（无搜索词）", raw: {} },
        { id: "b01", name: "B01留资页-用户未登录（有搜索词）", raw: {} }
      ],
      downloadedImages: []
    });

    expect(context.implementationGuide.recommendedOrder).toEqual(["b01", "b02"]);
  });
});
