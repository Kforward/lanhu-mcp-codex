import type {
  DownloadedImage,
  ImplementationGuide,
  LanhuImageDetail,
  LanhuParsedUrl,
  LanhuProjectImage,
  LocalAsset,
  PageFlow,
  RestorationContext,
  RestorationPage,
  RestorationPageRole
} from "../types.js";

export function buildRestorationContext(options: {
  parsed: LanhuParsedUrl;
  images: Array<LanhuProjectImage & { localImagePath?: string }>;
  downloadedImages: DownloadedImage[];
  selectedImage?: LanhuImageDetail;
}): RestorationContext {
  const pages = options.images.map((image) => buildRestorationPage(image, options.parsed, options.selectedImage));
  const assets = options.downloadedImages.map(toLocalAsset);
  const implementationGuide = buildImplementationGuide(options.parsed, pages);

  return {
    pages,
    assets,
    implementationGuide
  };
}

function buildRestorationPage(
  image: LanhuProjectImage & { localImagePath?: string },
  parsed: LanhuParsedUrl,
  selectedImage?: LanhuImageDetail
): RestorationPage {
  const role = inferPageRole(image.name);
  return {
    id: image.id,
    name: image.name,
    role,
    roleReason: roleReason(role, image.name),
    implementationHint: implementationHint(role),
    apiSize: image.width || image.height ? { width: image.width, height: image.height } : undefined,
    position: image.position,
    thumbnailUrl: image.thumbnailUrl,
    localImagePath: image.localImagePath,
    isSelected: image.id === parsed.imageId || image.id === selectedImage?.id
  };
}

function toLocalAsset(image: DownloadedImage): LocalAsset {
  return {
    imageId: image.imageId,
    imageName: image.imageName,
    sourceUrl: image.sourceUrl,
    localPath: image.path,
    contentType: image.contentType,
    usage: "board_preview"
  };
}

function buildImplementationGuide(parsed: LanhuParsedUrl, pages: RestorationPage[]): ImplementationGuide {
  const leadCapturePages = sortPagesByBoardNumber(pages.filter((page) => page.role === "lead_capture"));
  const loadingPages = sortPagesByBoardNumber(pages.filter((page) => page.role === "loading"));
  const paymentPages = sortPagesByBoardNumber(pages.filter((page) => page.role === "payment"));
  const assetPages = sortPagesByBoardNumber(pages.filter((page) => page.role === "asset_sheet"));
  const ordered = [
    ...leadCapturePages,
    ...loadingPages,
    ...paymentPages,
    ...assetPages,
    ...sortPagesByBoardNumber(pages.filter((page) => page.role === "unknown"))
  ];
  const flows = buildPageFlows(leadCapturePages, loadingPages, paymentPages);
  const limitations = [
    "V1.1 仍以蓝湖 API 元数据和画板预览图为主，暂未解析完整图层树、Design Tokens 或标注切图。",
    "页面角色和流程关系来自画板名称的轻量推断，落地实现前应结合预览图人工确认。"
  ];

  if (parsed.docType === "axure") {
    limitations.push("当前链接包含 docType=axure，但 Axure/PRD 深度解析计划在后续版本实现。");
  }

  return {
    purpose: "辅助 Codex 根据蓝湖设计稿进行页面/组件代码还原。",
    recommendedOrder: ordered.map((page) => page.id),
    pageFlows: flows,
    codexInstructions: [
      "优先阅读本 Markdown 的页面关系和本地资源路径，再查看 context.json 获取结构化数据。",
      "先实现主流程页面，再补充 loading、支付状态和素材页相关资源。",
      "还原 UI 时以本地缩略图/预览图作为视觉参考；如果缺少图层数据，不要臆造精确 token。",
      "发现蓝湖 API 字段不足时，将缺口记录到 docs/HANDOFF.md 或后续任务，不要在工具层硬编码一次性逻辑。"
    ],
    assumptions: [
      "画板名称中的 B01/B02/B03/B04 表示业务流程或状态顺序。",
      "包含“留资”的画板通常是咨询输入/线索收集页。",
      "包含“loading”或“跳转支付”的画板通常是支付前的方案生成过渡态。",
      "包含“支付”的画板通常是转化/支付页。",
      "包含“头像”的画板通常是素材或资源清单。"
    ],
    limitations
  };
}

function sortPagesByBoardNumber(pages: RestorationPage[]): RestorationPage[] {
  return [...pages].sort((a, b) => {
    const aNumber = extractBoardNumber(a.name);
    const bNumber = extractBoardNumber(b.name);
    if (aNumber !== undefined && bNumber !== undefined && aNumber !== bNumber) {
      return aNumber - bNumber;
    }
    if (aNumber !== undefined && bNumber === undefined) {
      return -1;
    }
    if (aNumber === undefined && bNumber !== undefined) {
      return 1;
    }
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

function extractBoardNumber(name: string): number | undefined {
  const match = name.match(/B(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function buildPageFlows(
  leadCapturePages: RestorationPage[],
  loadingPages: RestorationPage[],
  paymentPages: RestorationPage[]
): PageFlow[] {
  const orderedPageIds = [...leadCapturePages, ...loadingPages, ...paymentPages].map((page) => page.id);
  if (orderedPageIds.length === 0) {
    return [];
  }

  return [
    {
      summary: "推断主流程：留资咨询页 -> 生成方案/loading -> 支付页。",
      orderedPageIds,
      confidence: leadCapturePages.length > 0 && loadingPages.length > 0 && paymentPages.length > 0 ? "medium" : "low"
    }
  ];
}

function inferPageRole(name: string): RestorationPageRole {
  const normalized = name.toLowerCase();
  if (name.includes("留资") || normalized.includes("lead")) {
    return "lead_capture";
  }
  if (name.includes("支付")) {
    return normalized.includes("loading") || name.includes("跳转") ? "loading" : "payment";
  }
  if (normalized.includes("loading") || name.includes("加载")) {
    return "loading";
  }
  if (name.includes("头像") || name.includes("素材") || normalized.includes("asset")) {
    return "asset_sheet";
  }
  if (name.includes("原型") || name.includes("需求") || normalized.includes("prd") || normalized.includes("axure")) {
    return "prototype_or_prd";
  }
  return "unknown";
}

function roleReason(role: RestorationPageRole, name: string): string {
  switch (role) {
    case "lead_capture":
      return `画板名称 "${name}" 包含留资/咨询线索语义。`;
    case "loading":
      return `画板名称 "${name}" 包含 loading、跳转支付或过渡态语义。`;
    case "payment":
      return `画板名称 "${name}" 包含支付语义。`;
    case "asset_sheet":
      return `画板名称 "${name}" 看起来是头像、素材或资源清单。`;
    case "prototype_or_prd":
      return `画板名称 "${name}" 看起来与原型或需求文档相关。`;
    default:
      return `无法从画板名称 "${name}" 稳定推断页面角色。`;
  }
}

function implementationHint(role: RestorationPageRole): string {
  switch (role) {
    case "lead_capture":
      return "作为主入口页面实现，重点还原顶部信任背书、咨询分类、聊天式输入和 CTA。";
    case "loading":
      return "作为过渡状态实现，重点还原遮罩、进度步骤、加载文案和状态切换。";
    case "payment":
      return "作为转化页面实现，重点还原律师卡片、服务卖点、价格、倒计时 CTA 和支付方式。";
    case "asset_sheet":
      return "作为资源参考页处理，优先提取可复用头像、人物图或图标资源。";
    case "prototype_or_prd":
      return "作为需求/原型参考处理，优先提取流程和交互说明。";
    default:
      return "先查看预览图确认页面用途，再决定组件拆分和实现顺序。";
  }
}
