import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { parseLanhuUrl } from "../core/url.js";
import { parseUrlInputShape, ParseUrlInputSchema } from "../types.js";
import { toolError, toolSuccess } from "./helpers.js";

export function registerParseUrlTool(server: McpServer): void {
  server.registerTool(
    "lanhu_parse_url",
    {
      title: "Parse Lanhu URL",
      description: "Parse a Lanhu project/design URL into pid, tid, image_id, doc and route fields.",
      inputSchema: parseUrlInputShape,
      annotations: { readOnlyHint: true }
    },
    async (input) => {
      try {
        const { url } = ParseUrlInputSchema.parse(input);
        return toolSuccess(parseLanhuUrl(url));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
