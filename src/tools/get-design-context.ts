import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateDesignContext } from "../core/context.js";
import { LanhuApiClient } from "../core/lanhu-api.js";
import { LanhuHttpClient } from "../core/http.js";
import { parseLanhuUrl, requireProjectParams } from "../core/url.js";
import { getDesignContextInputShape, GetDesignContextInputSchema } from "../types.js";
import { toolError, toolSuccess } from "./helpers.js";

export function registerGetDesignContextTool(server: McpServer): void {
  server.registerTool(
    "lanhu_get_design_context",
    {
      title: "Generate Lanhu Design Context",
      description: "Generate local context.md/context.json and optional thumbnail files from a Lanhu URL.",
      inputSchema: getDesignContextInputShape,
      annotations: { readOnlyHint: true }
    },
    async (input) => {
      try {
        const args = GetDesignContextInputSchema.parse(input);
        const parsed = parseLanhuUrl(args.url);
        const project = requireProjectParams(parsed);
        const http = new LanhuHttpClient();
        const api = new LanhuApiClient(http);

        const [projectImages, projectInfo, selectedImage] = await Promise.all([
          api.getProjectImages(project),
          api.getProjectInfo(project).catch((error: unknown) => ({
            title: undefined,
            raw: {
              warning: error instanceof Error ? error.message : String(error)
            }
          })),
          parsed.imageId
            ? api.getImageDetail({ ...project, imageId: parsed.imageId }).catch((error: unknown) => ({
                id: parsed.imageId,
                raw: {
                  warning: error instanceof Error ? error.message : String(error)
                }
              }))
            : Promise.resolve(undefined)
        ]);

        const context = await generateDesignContext({
          sourceUrl: args.url,
          parsed,
          project: projectInfo,
          selectedImage,
          images: projectImages.images,
          outputDir: args.outputDir,
          includeImages: args.includeImages ?? true,
          request: {
            targetImageId: args.targetImageId,
            targetImageName: args.targetImageName,
            targetDescription: args.targetDescription,
            targetRegion: args.targetRegion
          },
          http
        });

        return toolSuccess(context);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
