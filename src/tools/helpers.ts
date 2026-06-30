import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { LanhuHttpError } from "../core/http.js";
import { LanhuUrlError } from "../core/url.js";

export function jsonToolResult(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2)
      }
    ],
    structuredContent: isPlainObject(data) ? data : undefined
  };
}

export function toolSuccess(data: unknown): CallToolResult {
  return jsonToolResult({
    ok: true,
    data
  });
}

export function toolError(error: unknown): CallToolResult {
  return {
    ...jsonToolResult({
      ok: false,
      error: normalizeToolError(error)
    }),
    isError: true
  };
}

export function normalizeToolError(error: unknown): Record<string, unknown> {
  if (error instanceof LanhuHttpError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      url: error.url,
      suggestion: error.suggestion
    };
  }

  if (error instanceof LanhuUrlError) {
    return {
      code: error.code,
      message: error.message
    };
  }

  if (error instanceof Error) {
    return {
      code: "LANHU_MCP_ERROR",
      message: error.message
    };
  }

  return {
    code: "LANHU_MCP_UNKNOWN_ERROR",
    message: String(error)
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
