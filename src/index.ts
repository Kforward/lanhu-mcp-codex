#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGetDesignContextTool } from "./tools/get-design-context.js";
import { registerListProjectImagesTool } from "./tools/list-project-images.js";
import { registerParseUrlTool } from "./tools/parse-url.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "lanhu-readonly-mcp",
    version: "0.1.0"
  });

  registerParseUrlTool(server);
  registerListProjectImagesTool(server);
  registerGetDesignContextTool(server);

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`lanhu-readonly-mcp failed to start: ${message}`);
  process.exit(1);
});
