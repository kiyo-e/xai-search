import { Hono } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import { buildServer } from "./app";
import { runSearch } from "./search";
import type { SearchParams } from "./search";
import type { Env } from "./env";

const app = new Hono<{ Bindings: Env }>();

app.post("/search/:input", async (c) => {
  const input = c.req.param("input");
  if (!input) return c.text("Missing 'input'", 400);

  const body = await c.req.json().catch(() => ({}));

  const text = await runSearch(input, c.env as Env, body as SearchParams);
  return c.text(text);
});

app.all("/mcp", async (c) => {
  const server = buildServer(c.env);
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(c);
});

export default app;
export type { Env };
