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
  fileSizeBytes?: number;
  pixelSize?: ImageSize;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageScale {
  x?: number;
  y?: number;
}

export interface TargetRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateSpace?: "api" | "downloaded" | "unknown";
}

export interface DesignContextRequest {
  targetImageId?: string;
  targetImageName?: string;
  targetDescription?: string;
  targetRegion?: TargetRegion;
}

export interface ContextSchemaInfo {
  schemaVersion: "1.1.1";
  capabilities: {
    hasRestorationContext: true;
    supportsTargetImageFocus: true;
    supportsTargetDescription: true;
    supportsTargetRegion: true;
    includesImageDimensions: true;
    includesBusinessImplementationGuide: true;
    requiresMcpRestartAfterBuild: true;
  };
  restartHint: string;
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
  fileSizeBytes?: number;
  pixelSize?: ImageSize;
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
  localImage?: {
    path: string;
    contentType?: string;
    fileSizeBytes?: number;
    pixelSize?: ImageSize;
    apiToPixelScale?: ImageScale;
  };
  isSelected: boolean;
}

export interface TargetFocus {
  requested: DesignContextRequest;
  selectedImageId?: string;
  selectedImageName?: string;
  selectedPageRole?: RestorationPageRole;
  source: "explicit-image-id" | "explicit-image-name" | "url-image-id" | "none";
  warnings: string[];
  component?: {
    description?: string;
    region?: TargetRegion;
    instruction: string;
  };
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
  businessImplementationChecklist: string[];
  assumptions: string[];
  limitations: string[];
}

export interface RestorationContext {
  pages: RestorationPage[];
  assets: LocalAsset[];
  targetFocus: TargetFocus;
  implementationGuide: ImplementationGuide;
}

export interface DesignContext {
  schema: ContextSchemaInfo;
  generatedAt: string;
  sourceUrl: string;
  parsed: LanhuParsedUrl;
  request: DesignContextRequest;
  project?: LanhuProjectInfo;
  selectedImage?: LanhuImageDetail;
  images: Array<LanhuProjectImage & { localImagePath?: string; localImage?: RestorationPage["localImage"] }>;
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
    schemaVersion: ContextSchemaInfo["schemaVersion"];
    selectedImageName?: string;
    selectedImageId?: string;
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
  includeImages: z.boolean().optional(),
  targetImageId: z.string().min(1).optional(),
  targetImageName: z.string().min(1).optional(),
  targetDescription: z.string().min(1).optional(),
  targetRegion: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    coordinateSpace: z.enum(["api", "downloaded", "unknown"]).optional()
  }).optional()
};

export const ParseUrlInputSchema = z.object(parseUrlInputShape);
export const ListProjectImagesInputSchema = z.object(listProjectImagesInputShape);
export const GetDesignContextInputSchema = z.object(getDesignContextInputShape);

export type ParseUrlInput = z.infer<typeof ParseUrlInputSchema>;
export type ListProjectImagesInput = z.infer<typeof ListProjectImagesInputSchema>;
export type GetDesignContextInput = z.infer<typeof GetDesignContextInputSchema>;
