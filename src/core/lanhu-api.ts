import type { LanhuHttpClient } from "./http.js";
import type { LanhuImageDetail, LanhuProjectImage, LanhuProjectInfo } from "../types.js";
import { asNumber, asString, collectUrls, isRecord, pickFirstNumber, pickFirstString } from "../utils/object.js";

export interface ProjectParams {
  pid: string;
  tid: string;
}

export interface ImageParams extends ProjectParams {
  imageId: string;
}

export interface ProjectImagesResponse {
  raw: unknown;
  images: LanhuProjectImage[];
}

export class LanhuApiClient {
  constructor(private readonly http: LanhuHttpClient) {}

  async getProjectImages(params: ProjectParams): Promise<ProjectImagesResponse> {
    const raw = await this.http.getJson<unknown>(buildPath("/api/project/images", {
      project_id: params.pid,
      team_id: params.tid,
      dds_status: "1",
      position: "1",
      show_cb_src: "1",
      comment: "1"
    }));

    return {
      raw,
      images: extractImageItems(raw).map(normalizeProjectImage)
    };
  }

  async getImageDetail(params: ImageParams): Promise<LanhuImageDetail> {
    const raw = await this.http.getJson<unknown>(buildPath("/api/project/image", {
      team_id: params.tid,
      project_id: params.pid,
      image_id: params.imageId
    }));

    return normalizeImageDetail(raw, params.imageId);
  }

  async getProjectInfo(params: ProjectParams): Promise<LanhuProjectInfo> {
    const raw = await this.http.getJson<unknown>(buildPath("/api/project/project_info", {
      basic_info: "1",
      pid: params.pid,
      team_id: params.tid
    }));

    return {
      title: findFirstStringByKeys(raw, ["name", "title", "project_name", "projectName"]),
      raw
    };
  }
}

function buildPath(pathname: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params);
  return `${pathname}?${query.toString()}`;
}

function extractImageItems(raw: unknown): Record<string, unknown>[] {
  const candidates = [
    raw,
    getAtPath(raw, ["data"]),
    getAtPath(raw, ["data", "images"]),
    getAtPath(raw, ["data", "list"]),
    getAtPath(raw, ["data", "items"]),
    getAtPath(raw, ["data", "records"]),
    getAtPath(raw, ["result"]),
    getAtPath(raw, ["result", "images"]),
    getAtPath(raw, ["images"]),
    getAtPath(raw, ["list"])
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
  }

  return [];
}

function normalizeProjectImage(item: Record<string, unknown>, index: number): LanhuProjectImage {
  const id =
    pickFirstString(item, ["id", "image_id", "imageId", "uuid", "objectId", "docId"]) ??
    `image-${index + 1}`;
  const name = pickFirstString(item, ["name", "title", "image_name", "imageName", "file_name", "fileName"]) ?? id;
  const positionRecord = isRecord(item.position) ? item.position : item;

  return {
    id,
    name,
    width: pickFirstNumber(item, ["width", "w", "image_width", "imageWidth"]),
    height: pickFirstNumber(item, ["height", "h", "image_height", "imageHeight"]),
    thumbnailUrl: findBestImageUrl(item),
    sourceUrl: pickFirstString(item, ["url", "src", "source", "sourceUrl", "image_url", "imageUrl"]),
    position: {
      x: pickFirstNumber(positionRecord, ["x", "left", "position_x", "positionX"]),
      y: pickFirstNumber(positionRecord, ["y", "top", "position_y", "positionY"])
    },
    raw: item
  };
}

function normalizeImageDetail(raw: unknown, fallbackId: string): LanhuImageDetail {
  const record = findFirstRecord(raw) ?? {};
  return {
    id: findFirstStringByKeys(raw, ["id", "image_id", "imageId"]) ?? fallbackId,
    name: findFirstStringByKeys(raw, ["name", "title", "image_name", "imageName"]),
    width: findFirstNumberByKeys(raw, ["width", "w", "image_width", "imageWidth"]),
    height: findFirstNumberByKeys(raw, ["height", "h", "image_height", "imageHeight"]),
    previewUrl: findBestImageUrl(record),
    raw
  };
}

function findBestImageUrl(item: Record<string, unknown>): string | undefined {
  const direct = pickFirstString(item, [
    "thumbnailUrl",
    "thumbnail_url",
    "thumb",
    "thumbUrl",
    "cover",
    "cover_url",
    "coverUrl",
    "preview",
    "previewUrl",
    "preview_url",
    "src",
    "url",
    "image_url",
    "imageUrl"
  ]);

  if (direct) {
    return direct;
  }

  const urls = collectUrls(item);
  return (
    urls.find((url) => /assets\.lanhuapp\.com|lhcdn\.lanhuapp\.com/i.test(url) && /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url)) ??
    urls.find((url) => /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url)) ??
    urls[0]
  );
}

function getAtPath(source: unknown, path: string[]): unknown {
  let current = source;
  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function findFirstRecord(raw: unknown): Record<string, unknown> | undefined {
  if (isRecord(raw)) {
    if (isRecord(raw.data)) {
      return raw.data;
    }
    if (isRecord(raw.result)) {
      return raw.result;
    }
    return raw;
  }

  return undefined;
}

function findFirstStringByKeys(raw: unknown, keys: string[]): string | undefined {
  const record = findFirstRecord(raw);
  if (!record) {
    return undefined;
  }

  const direct = pickFirstString(record, keys);
  if (direct) {
    return direct;
  }

  for (const value of Object.values(record)) {
    if (isRecord(value)) {
      const nested = pickFirstString(value, keys);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function findFirstNumberByKeys(raw: unknown, keys: string[]): number | undefined {
  const record = findFirstRecord(raw);
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const direct = asNumber(record[key]);
    if (direct !== undefined) {
      return direct;
    }
  }

  for (const value of Object.values(record)) {
    if (!isRecord(value)) {
      continue;
    }

    for (const key of keys) {
      const nested = asNumber(value[key]);
      if (nested !== undefined) {
        return nested;
      }
    }
  }

  return undefined;
}
