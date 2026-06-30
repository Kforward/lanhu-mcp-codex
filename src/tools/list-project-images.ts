import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LanhuApiClient } from "../core/lanhu-api.js";
import { LanhuHttpClient } from "../core/http.js";
import { parseLanhuUrl, requireProjectParams } from "../core/url.js";
import { listProjectImagesInputShape, ListProjectImagesInputSchema } from "../types.js";
import { toolError, toolSuccess } from "./helpers.js";

export function registerListProjectImagesTool(server: McpServer): void {
  server.registerTool(
    "lanhu_list_project_images",
    {
      title: "List Lanhu Project Images",
      description: "Read a Lanhu project's design image list. This tool is read-only and does not write files.",
      inputSchema: listProjectImagesInputShape,
      annotations: { readOnlyHint: true }
    },
    async (input) => {
      try {
        const args = ListProjectImagesInputSchema.parse(input);
        const parsed = args.url ? parseLanhuUrl(args.url) : undefined;
        const project = requireProjectParams({
          pid: args.pid ?? parsed?.pid,
          tid: args.tid ?? parsed?.tid
        });
        const api = new LanhuApiClient(new LanhuHttpClient());
        const result = await api.getProjectImages(project);

        return toolSuccess({
          parsed,
          project,
          imageCount: result.images.length,
          images: result.images
        });
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
