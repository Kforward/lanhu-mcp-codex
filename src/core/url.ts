import type { LanhuParsedUrl, RawQuery } from "../types.js";

const QUERY_ALIASES = {
  pid: ["pid", "project_id", "projectId"],
  tid: ["tid", "team_id", "teamId"],
  imageId: ["image_id", "imageId", "img_id", "imgId"],
  docId: ["docId", "doc_id"],
  docType: ["docType", "doc_type"],
  pageId: ["pageId", "page_id"],
  parentId: ["parentId", "parent_id"],
  versionId: ["versionId", "version_id"]
} as const;

export class LanhuUrlError extends Error {
  readonly code = "LANHU_URL_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "LanhuUrlError";
  }
}

export function parseLanhuUrl(urlText: string): LanhuParsedUrl {
  let url: URL;

  try {
    url = new URL(urlText);
  } catch {
    throw new LanhuUrlError("蓝湖链接不是有效 URL。请传入完整的 https://lanhuapp.com/... 链接。");
  }

  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const [hashPath = "", hashQuery = ""] = hash.split("?");
  const route = hashPath || url.pathname || "/";

  const searchParams = new URLSearchParams(url.search);
  const hashParams = new URLSearchParams(hashQuery);
  const rawQuery = mergeQueryParams(searchParams, hashParams);

  const parsed: LanhuParsedUrl = {
    originalUrl: urlText,
    route,
    pid: getFirstAlias(rawQuery, QUERY_ALIASES.pid),
    tid: getFirstAlias(rawQuery, QUERY_ALIASES.tid),
    imageId: getFirstAlias(rawQuery, QUERY_ALIASES.imageId),
    docId: getFirstAlias(rawQuery, QUERY_ALIASES.docId),
    docType: getFirstAlias(rawQuery, QUERY_ALIASES.docType),
    pageId: getFirstAlias(rawQuery, QUERY_ALIASES.pageId),
    parentId: getFirstAlias(rawQuery, QUERY_ALIASES.parentId),
    versionId: getFirstAlias(rawQuery, QUERY_ALIASES.versionId),
    rawQuery
  };

  return parsed;
}

export function requireProjectParams(params: { pid?: string; tid?: string }): { pid: string; tid: string } {
  if (!params.pid || !params.tid) {
    throw new LanhuUrlError("缺少蓝湖项目参数 pid/tid。请传入项目链接，或同时传入 pid 和 tid。");
  }

  return {
    pid: params.pid,
    tid: params.tid
  };
}

function mergeQueryParams(...queries: URLSearchParams[]): RawQuery {
  const result: RawQuery = {};

  for (const query of queries) {
    for (const [key, value] of query.entries()) {
      const existing = result[key];
      if (existing === undefined) {
        result[key] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
    }
  }

  return result;
}

function getFirstAlias(rawQuery: RawQuery, aliases: readonly string[]): string | undefined {
  for (const alias of aliases) {
    const value = rawQuery[alias];
    if (Array.isArray(value)) {
      const first = value.find((item) => item.length > 0);
      if (first) {
        return first;
      }
    } else if (value) {
      return value;
    }
  }

  return undefined;
}
