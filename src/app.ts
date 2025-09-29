import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Env } from "./env";
import { ALLOWED_SEARCH_PARAM_KEYS, runSearch } from "./search";

// Design doc: docs/design/live-search.md captures the live-search MCP contract and data flow.
// Related classes: McpServer wires the tool plumbing; StdioServerTransport (src/cli.ts) and StreamableHTTPTransport (src/index.ts) host it for CLI/HTTP clients.

const toolParamsShape = {
  input: z
    .string()
    .describe("Ask questions, search for information, or consult about complex problems in English."),
  mode: z
    .string()
    .describe("Controls Grok live search mode (auto | on | off). Defaults to env or 'on'.")
    .optional(),
  return_citations: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .describe("Whether to request citation metadata in Grok responses.")
    .optional(),
  max_search_results: z
    .union([z.number(), z.string()])
    .describe("Maximum number of search results Grok should retrieve (integer).")
    .optional(),
  from_date: z
    .string()
    .describe("Lower bound for result timestamps (ISO 8601 date string).")
    .optional(),
  to_date: z
    .string()
    .describe("Upper bound for result timestamps (ISO 8601 date string).")
    .optional(),
  sources: z
    .union([
      z.string(),
      z.record(z.string(), z.unknown()),
      z.array(z.union([z.string(), z.record(z.string(), z.unknown())])),
    ])
    .describe("Override search corpus. Accepts JSON, object, array, or comma-separated source types.")
    .optional(),
} satisfies z.ZodRawShape;

const toolParamsSchema = z.object(toolParamsShape);

type ToolInput = z.output<typeof toolParamsSchema>;

export const buildServer = (env: Env) => {
  const server = new McpServer({ name: "xai-web-search", version: "0.0.1" });

  server.tool(
    "xai-web-search",
    `An AI agent with advanced web search capabilities. Useful for finding the latest information, troubleshooting errors, and discussing ideas or design challenges. Supports natural language queries.`,
    toolParamsShape,
    async (args: ToolInput) => {
      const { input, ...rawSearchParams } = args;
      const paramRecord = rawSearchParams as Record<string, unknown>;
      const searchParams: Record<string, unknown> = {};
      for (const key of ALLOWED_SEARCH_PARAM_KEYS) {
        const value = paramRecord[key];
        if (value === undefined) continue;
        searchParams[key] = value;
      }
      const text = await runSearch(input, env, searchParams);
      return { content: [{ type: "text", text }] };
    }
  );

  return server;
};
