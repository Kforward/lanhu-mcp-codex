import { z } from "zod/v4";

export type RawQueryValue = string | string[];
export type RawQuery = Record<string, RawQueryValue>;

export interface LanhuParsedUrl {
  originalUrl: string;
  route: string;
  pid?: string;
  tid?: string;
  imageId?: string;
  docId?: string;
  docType?: string;
  pageId?: string;
  parentId?: string;
  versionId?: string;
  rawQuery: RawQuery;
}

export interface LanhuProjectImage {
  id: string;
  name: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  sourceUrl?: string;
  position?: {
    x?: number;
    y?: number;
  };
  raw: unknown;
}

export interface LanhuProjectInfo {
  title?: string;
  raw: unknown;
}

export interface LanhuImageDetail {
  id?: string;
  name?: string;
  width?: number;
  height?: number;
  previewUrl?: string;
  raw: unknown;
}

export interface DownloadedImage {
  imageId: string;
  imageName: string;
  sourceUrl: string;
  path: string;
  contentType?: string;
}

export type RestorationPageRole =
  | "lead_capture"
  | "payment"
  | "loading"
  | "asset_sheet"
  | "prototype_or_prd"
  | "unknown";

export interface LocalAsset {
  imageId: string;
  imageName: string;
  sourceUrl: string;
  localPath: string;
  contentType?: string;
  usage: "board_preview";
}

export interface RestorationPage {
  id: string;
  name: string;
  role: RestorationPageRole;
  roleReason: string;
  implementationHint: string;
  apiSize?: {
    width?: number;
    height?: number;
  };
  position?: {
    x?: number;
    y?: number;
  };
  thumbnailUrl?: string;
  localImagePath?: string;
  isSelected: boolean;
}

export interface PageFlow {
  summary: string;
  orderedPageIds: string[];
  confidence: "low" | "medium" | "high";
}

export interface ImplementationGuide {
  purpose: string;
  recommendedOrder: string[];
  pageFlows: PageFlow[];
  codexInstructions: string[];
  assumptions: string[];
  limitations: string[];
}

export interface RestorationContext {
  pages: RestorationPage[];
  assets: LocalAsset[];
  implementationGuide: ImplementationGuide;
}

export interface DesignContext {
  generatedAt: string;
  sourceUrl: string;
  parsed: LanhuParsedUrl;
  project?: LanhuProjectInfo;
  selectedImage?: LanhuImageDetail;
  images: Array<LanhuProjectImage & { localImagePath?: string }>;
  restoration: RestorationContext;
  artifacts: {
    runDirectory: string;
    contextJsonPath: string;
    contextMarkdownPath: string;
    imagesDirectory: string;
  };
  warnings: string[];
}

export interface DesignContextResult {
  summary: {
    projectTitle?: string;
    imageCount: number;
    downloadedImageCount: number;
    warningCount: number;
  };
  contextJsonPath: string;
  contextMarkdownPath: string;
  imagePaths: string[];
  warnings: string[];
}

export const parseUrlInputShape = {
  url: z.string().min(1, "url is required")
};

export const listProjectImagesInputShape = {
  url: z.string().min(1).optional(),
  pid: z.string().min(1).optional(),
  tid: z.string().min(1).optional()
};

export const getDesignContextInputShape = {
  url: z.string().min(1, "url is required"),
  outputDir: z.string().min(1).optional(),
  includeImages: z.boolean().optional()
};

export const ParseUrlInputSchema = z.object(parseUrlInputShape);
export const ListProjectImagesInputSchema = z.object(listProjectImagesInputShape);
export const GetDesignContextInputSchema = z.object(getDesignContextInputShape);

export type ParseUrlInput = z.infer<typeof ParseUrlInputSchema>;
export type ListProjectImagesInput = z.infer<typeof ListProjectImagesInputSchema>;
export type GetDesignContextInput = z.infer<typeof GetDesignContextInputSchema>;
