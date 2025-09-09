import { Hono } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import { buildServer } from "./app";
import { runSearch } from "./search";

export interface Env {
  OPENAI_API_KEY: string
  SEARCH_CONTEXT_SIZE?: 'low' | 'medium' | 'high'
  REASONING_EFFORT?: 'low' | 'medium' | 'high'
  TZ?: string
}
const app = new Hono<{ Bindings: Env }>()

app.post("/search/:input", async (c) => {
  const input = c.req.param("input");
  if (!input) return c.text("Missing 'input'", 400);
  const text = await runSearch(input, c.env as Env);
  return c.text(text);
});

app.all("/mcp", async (c) => {
  const server = buildServer(c.env);
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(c);
});

export default app;