#!/usr/bin/env node
import { cli as honoCli } from 'hono-cli-adapter'
import { serve } from "@hono/node-server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import app from "./index";
import { buildServer } from "./app";
import type { Env } from "./env";

const args = process.argv.slice(2);
const useStdio = args.includes("--stdio");
const isServe = args[0] === "serve" || args[0] === "server" || args.includes("--server") || args.includes("--http");
const port = Number(process.env.PORT || "9876");

if (useStdio) {
  (async () => {
    const server = buildServer(process.env as unknown as Env);
    const transport = new StdioServerTransport();
    await server.connect(transport);
  })().catch((e) => {
    console.error("stdio server failed:", e?.message || e);
    process.exit(1);
  });
} else if (isServe) {
  console.log(`HTTP mode: http://localhost:${port}/mcp`);
  serve({ port, fetch: app.fetch });
} else {
  await honoCli(app);
}
