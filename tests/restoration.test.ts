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

  it("selects a target board and records component-level restoration intent", () => {
    const parsed: LanhuParsedUrl = {
      originalUrl: "https://lanhuapp.com/web/#/item/project/detailDetach?pid=p1&tid=t1&image_id=axure-doc",
      route: "/item/project/detailDetach",
      pid: "p1",
      tid: "t1",
      imageId: "axure-doc",
      rawQuery: {
        pid: "p1",
        tid: "t1",
        image_id: "axure-doc"
      }
    };

    const context = buildRestorationContext({
      parsed,
      images: [
        { id: "b01", name: "B01留资页-用户未登录（有搜索词）", raw: {} },
        { id: "b03", name: "B03 支付页-默认无底部内容", raw: {} }
      ],
      downloadedImages: [],
      request: {
        targetImageName: "有搜索词",
        targetDescription: "只实现底部聊天输入栏组件",
        targetRegion: {
          x: 0,
          y: 650,
          width: 375,
          height: 98,
          coordinateSpace: "api"
        }
      }
    });

    expect(context.targetFocus).toMatchObject({
      selectedImageId: "b01",
      selectedImageName: "B01留资页-用户未登录（有搜索词）",
      selectedPageRole: "lead_capture",
      source: "explicit-image-name"
    });
    expect(context.targetFocus.component?.instruction).toContain("组件级还原目标");
    expect(context.pages.find((page) => page.id === "b01")?.isSelected).toBe(true);
    expect(context.implementationGuide.businessImplementationChecklist[0]).toContain("组件级任务");
  });
});
