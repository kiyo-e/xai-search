# xai-search

`xai-search` is a compact Grok live-search helper that lets the same Hono application power four different integration modes:

- CLI (`xai-search search <input>`)
- HTTP server (`/search` and `/mcp` endpoints)
- Local MCP server over stdio
- Remote MCP server over HTTP via `StreamableHTTPTransport`

The goal is to make xAI's Grok 4 Fast web search reachable from your own agents with minimal glue code.

See `docs/design/live-search.md` for the internal wiring between the CLI adapter, HTTP routes, and MCP server.

## Requirements

- Node.js 18+ (or [Bun](https://bun.sh/))
- `XAI_API_KEY` with access to Grok live search

Optional:

- `XAI_MODEL` (defaults to `grok-4-fast`)
- `XAI_BASE_URL` (defaults to `https://api.x.ai/v1`)
- `GROK_SEARCH_MODE` (`auto|on|off`, defaults to `auto`)
- `TZ` (forwarded to the CLI adapter, defaults to the host TZ)
- `PORT` when serving HTTP (defaults to `9876`)

## Quick Start

### CLI (recommended during development)
Run the CLI without installing locally:

```bash
# latest published version
XAI_API_KEY=sk-... npx xai-search@latest search "Rust learning roadmap"

# pin a version
XAI_API_KEY=sk-... npx xai-search@0.1.0 search "Next.js image optimization"

# avoid npx prompts
XAI_API_KEY=sk-... npx --yes xai-search@latest search "Supabase RLS basics"
```

Local scripts use Bun by default but work with Node as well:

```bash
# via npm script (Bun under the hood)
XAI_API_KEY=sk-... npm run cli -- search "Compare LLMs"

# direct Bun execution
XAI_API_KEY=sk-... bun src/cli.ts search "Vite plugin ideas"

# CLI flags
bun src/cli.ts --help
```

`--json` pretty-prints the response, and `--env` lets you point to a `.env` file or supply ad-hoc key/value overrides recognized by `hono-cli-adapter`.

### HTTP server (local)
Expose `/search` and `/mcp` over HTTP:

```bash
# npm script (alias: serve)
XAI_API_KEY=sk-... npm run cli:serve

# bun direct (flag form)
XAI_API_KEY=sk-... bun src/cli.ts --server

# custom port
PORT=8080 XAI_API_KEY=sk-... npm run cli:serve
```

Endpoints:

- `POST /search/:input` → returns plain text from Grok. Optional JSON body accepts search parameters (`mode`, `return_citations`, `max_search_results`, `from_date`, `to_date`).
- `POST /mcp` → MCP endpoint compatible with `StreamableHTTPTransport` clients.

Example request with overrides:

```bash
curl -sS -X POST http://localhost:9876/search/"Next.js image optimization" \
  --json '{
    "mode": "on",
    "return_citations": true,
    "max_search_results": 5
  }'
```

### Local MCP (stdio)
Run an MCP server over stdio for clients such as local coding agents:

```bash
XAI_API_KEY=sk-... npm run cli:stdio
```

### Remote MCP (HTTP)
Spin up the HTTP server and point your agent to `http://localhost:9876/mcp` using `@hono/mcp`'s `StreamableHTTPTransport`:

```bash
XAI_API_KEY=sk-... npm run cli:serve
# -> MCP tool id: xai-web-search
```

## Cloudflare Workers (optional)

- `npm run dev` — start a local worker (requires Wrangler)
- `npm run deploy` — deploy to Cloudflare Workers with minify enabled
- `npm run cf-typegen` — regenerate type definitions (`worker-configuration.d.ts`)

## Single Binary Build (Bun)

```bash
# debug style
npm run build:bin       # -> bin/xai-search

# release style
npm run build:bin:release

# invoke compiled binary
XAI_API_KEY=sk-... ./bin/xai-search search "Compare LLMs"
```

## Development

```bash
# install dependencies
npm install
# or
bun install

# build once (writes dist/cli.js)
npm run build

# format CLI usage
bun src/cli.ts --help
```

During CLI execution the adapter resolves environment values in this order:

1. `process.env`
2. Values supplied through adapter options (`options.env`) — unused by this binary
3. `--env KEY=VALUE` flags or `.env` file references

## Notes

- CLI requests map `search <input>` to `POST /search { input }` under the hood.
- `runSearch` currently returns the concatenated text from Grok; structured citations are surfaced when `return_citations` is enabled.
- MCP server metadata (`name`/`version`) lives in `src/app.ts`.
- Live search internals and future tuning switches are documented in `docs/design/live-search.md`.

## License / Credits

- MIT License
- CLI adapter provided by [`kiyo-e/hono-cli-adapter`](https://github.com/kiyo-e/hono-cli-adapter)
