import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Env } from "./env";
import { runSearch } from "./search";

// Design reference: docs/design/live-search.md outlines the server entrypoint contract.
// Related modules: src/search.ts encapsulates Grok Live Search calls; src/index.ts exposes HTTP bindings.

export const buildServer = (env: Env) => {
  const server = new McpServer({ name: "xai-web-search", version: "0.0.1" });

  server.tool(
    "xai-web-search",
    `An AI agent with advanced web search capabilities. Useful for finding the latest information, troubleshooting errors, and discussing ideas or design challenges. Supports natural language queries.`,
    { input: z.string().describe("Ask questions, search for information, or consult about complex problems in English.") },
    async ({ input }) => {
      const text = await runSearch(input, env, {});
      return { content: [{ type: "text", text }] };
    }
  );

  return server;
};
