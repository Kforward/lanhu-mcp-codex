import type {
  DownloadedImage,
  DesignContextRequest,
  ImplementationGuide,
  LanhuImageDetail,
  LanhuParsedUrl,
  LanhuProjectImage,
  LocalAsset,
  PageFlow,
  RestorationContext,
  RestorationPage,
  RestorationPageRole,
  TargetFocus
} from "../types.js";
import { buildLocalImageInfo } from "./image-assets.js";

export function buildRestorationContext(options: {
  parsed: LanhuParsedUrl;
  images: Array<LanhuProjectImage & { localImagePath?: string }>;
  downloadedImages: DownloadedImage[];
  selectedImage?: LanhuImageDetail;
  request?: DesignContextRequest;
}): RestorationContext {
  const request = options.request ?? {};
  const targetFocus = buildTargetFocus({
    parsed: options.parsed,
    images: options.images,
    request
  });
  const downloadedById = new Map(options.downloadedImages.map((image) => [image.imageId, image]));
  const pages = options.images.map((image) =>
    buildRestorationPage(image, options.parsed, options.selectedImage, targetFocus, downloadedById.get(image.id))
  );
  enrichTargetFocusFromPages(targetFocus, pages);
  const assets = options.downloadedImages.map(toLocalAsset);
  const implementationGuide = buildImplementationGuide(options.parsed, pages, targetFocus);

  return {
    pages,
    assets,
    targetFocus,
    implementationGuide
  };
}

function buildRestorationPage(
  image: LanhuProjectImage & { localImagePath?: string },
  parsed: LanhuParsedUrl,
  selectedImage: LanhuImageDetail | undefined,
  targetFocus: TargetFocus,
  downloadedImage?: DownloadedImage
): RestorationPage {
  const role = inferPageRole(image.name);
  const localImage = buildLocalImageInfo(image, downloadedImage);
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
    localImage,
    isSelected: image.id === targetFocus.selectedImageId || image.id === parsed.imageId || image.id === selectedImage?.id
  };
}

function toLocalAsset(image: DownloadedImage): LocalAsset {
  return {
    imageId: image.imageId,
    imageName: image.imageName,
    sourceUrl: image.sourceUrl,
    localPath: image.path,
    contentType: image.contentType,
    fileSizeBytes: image.fileSizeBytes,
    pixelSize: image.pixelSize,
    usage: "board_preview"
  };
}

function buildImplementationGuide(
  parsed: LanhuParsedUrl,
  pages: RestorationPage[],
  targetFocus: TargetFocus
): ImplementationGuide {
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
      "如果 targetFocus 指定了目标画板、组件描述或区域，先围绕该目标实现，不要默认还原整页。",
      "先实现主流程页面，再补充 loading、支付状态和素材页相关资源。",
      "还原 UI 时以本地缩略图/预览图作为视觉参考；如果缺少图层数据，不要臆造精确 token。",
      "落地到业务仓库时，先查找已有路由、相似版本页面、公共跳转、免登、埋点、字典配置和 SDK helper，优先复用或封装公共函数。",
      "配置、字典、埋点、免登、小程序辅助参数等非核心依赖失败时，默认记录兜底并保持页面主流程可继续；强阻断必须来自明确业务要求。",
      "发现蓝湖 API 字段不足时，将缺口记录到 docs/HANDOFF.md 或后续任务，不要在工具层硬编码一次性逻辑。"
    ],
    businessImplementationChecklist: buildBusinessChecklist(targetFocus),
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

function buildTargetFocus(options: {
  parsed: LanhuParsedUrl;
  images: Array<LanhuProjectImage & { localImagePath?: string }>;
  request: DesignContextRequest;
}): TargetFocus {
  const warnings: string[] = [];
  const requested = options.request;
  const byId = new Map(options.images.map((image) => [image.id, image]));
  const byName = requested.targetImageName
    ? options.images.find((image) => image.name === requested.targetImageName || image.name.includes(requested.targetImageName ?? ""))
    : undefined;

  let selected = requested.targetImageId ? byId.get(requested.targetImageId) : undefined;
  let source: TargetFocus["source"] = "none";

  if (requested.targetImageId) {
    source = "explicit-image-id";
    if (!selected) {
      warnings.push(`未在项目画板中找到 targetImageId=${requested.targetImageId}。`);
    }
  }

  if (!selected && byName) {
    selected = byName;
    source = "explicit-image-name";
  } else if (!selected && requested.targetImageName) {
    warnings.push(`未在项目画板中找到 targetImageName=${requested.targetImageName}。`);
  }

  if (!selected && options.parsed.imageId) {
    selected = byId.get(options.parsed.imageId);
    source = selected ? "url-image-id" : "none";
    if (!selected) {
      warnings.push(`链接中的 image_id=${options.parsed.imageId} 未匹配项目画板，可能指向 Axure/PRD 文档或非画板资源。`);
    }
  }

  return {
    requested,
    selectedImageId: selected?.id,
    selectedImageName: selected?.name,
    source,
    warnings,
    component: requested.targetDescription || requested.targetRegion
      ? {
          description: requested.targetDescription,
          region: requested.targetRegion,
          instruction: "这是组件级还原目标。请只围绕目标描述或目标区域实现组件，并把整页缩略图作为上下文参考。"
        }
      : undefined
  };
}

function enrichTargetFocusFromPages(targetFocus: TargetFocus, pages: RestorationPage[]): void {
  const selectedPage = pages.find((page) => page.id === targetFocus.selectedImageId);
  if (selectedPage) {
    targetFocus.selectedPageRole = selectedPage.role;
  }
}

function buildBusinessChecklist(targetFocus: TargetFocus): string[] {
  const targetInstruction = targetFocus.component
    ? "组件级任务：明确组件边界、输入输出、可复用资产和所在页面上下文，避免把整页都实现掉。"
    : "页面级任务：先确认目标画板和主流程，再实现页面结构。";

  return [
    targetInstruction,
    "在业务仓库中先搜索相似版本页面、路由配置、公共样式和已有组件，优先复用。",
    "跳转/免登/埋点/字典/SDK 能力应放在已有 helper 或新增公共函数中，页面组件只做业务编排。",
    "配置、广告、字典、埋点、定位、免登辅助参数失败时默认非阻塞，保留用户可继续路径。",
    "若需要新增字典 key、埋点枚举或小程序 path/query，在版本差异文档或交接文档中记录。"
  ];
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
