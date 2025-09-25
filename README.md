## xai-search

An implementation sample that uses one Hono-based application code to support four modes:

- CLI (local execution)
- Remote MCP (HTTP /mcp)
- Local MCP (stdio)
- HTTP API (/search)

Core behavior is inspired by:
- https://github.com/yoshiko-pg/o3-search-mcp/

### What It Is
- Purpose: Makes OpenAI’s high-end models and their powerful web search available to your AI agents.
- Modes: Usable both as an MCP server (stdio or HTTP) and as a stand-alone CLI.
- Agent integration: Register it as an MCP tool in any compatible AI coding agent, or instruct the agent to call the CLI. The agent can then autonomously consult OpenAI, research on the web, and work through multi-step, complex tasks.

### Requirements
- Node.js 18+ (or Bun)
- OpenAI API Key (`OPENAI_API_KEY`)


## Usage

### 1) CLI (recommended)
Use `search <input>`. Add `--json` for pretty JSON wrapping.

Run with npx (no local install):
```bash
# latest published version
OPENAI_API_KEY=sk-... npx xai-search@latest search "Rust learning roadmap"

# pin a specific version
OPENAI_API_KEY=sk-... npx xai-search@0.1.1 search "Next.js image optimization"

# tip: skip npx prompts
OPENAI_API_KEY=sk-... npx --yes xai-search@latest search "Supabase RLS basics"
```

Local runs during development:
```bash
# via npm script
OPENAI_API_KEY=sk-... npm run cli -- search "Rust learning roadmap"

# direct with Bun
OPENAI_API_KEY=sk-... bun src/cli.ts search "Next.js image optimization"

# shortcut
OPENAI_API_KEY=sk-... npm run search -- "Supabase RLS basics"
```


### 2) HTTP server (local)
Expose `/search` and `/mcp` over HTTP.

Aliases: `serve` | `server` | `--server` | `--http`

Examples:
```bash
# via npm script (serve alias)
OPENAI_API_KEY=sk-... npm run cli:serve

# with npx (flag)
OPENAI_API_KEY=sk-... npx --yes xai-search@latest --server

# with npx (alias command)
OPENAI_API_KEY=sk-... npx --yes xai-search@latest serve

# custom port (default: 9876)
PORT=8080 OPENAI_API_KEY=sk-... npx --yes xai-search@latest --http

# POST /search example
curl -sS -X POST localhost:9876/search \
  --json '{"input":"Next.js image optimization"}'

# MCP over HTTP endpoint
# -> http://localhost:9876/mcp
```


### 3) Local MCP (stdio)
Run an MCP server over stdio for local MCP-compatible clients.

Flag: `--stdio`

Examples:
```bash
# via npm script
OPENAI_API_KEY=sk-... npm run cli:stdio

# with npx (no local install)
OPENAI_API_KEY=sk-... npx --yes xai-search@latest --stdio
```


### 4) Remote MCP (HTTP)
Connect to `/mcp` using `@hono/mcp`’s `StreamableHTTPTransport`.

```bash
OPENAI_API_KEY=sk-... npm run cli:serve
# -> connect to http://localhost:9876/mcp
```


### Cloudflare Workers (optional)
Development:
```bash
npm run dev
```
Deploy:
```bash
npm run deploy
```
Type generation (optional): https://developers.cloudflare.com/workers/wrangler/commands/#types
```bash
npm run cf-typegen
```


## Single binary (Bun)
Build on each target platform.

```bash
# debug-like
npm run build:bin   # -> bin/xai-search

# release-like (minify)
npm run build:bin:release  # -> bin/xai-search

# run example
OPENAI_API_KEY=sk-... ./bin/xai-search search "Compare LLMs"
```

## Development

### Install
```bash
npm i
# or with Bun
bun install
```

### Environment
- `OPENAI_API_KEY` (required)
- `SEARCH_CONTEXT_SIZE` = `low|medium|high` (optional, default: `medium`)
- `REASONING_EFFORT` = `low|medium|high` (optional, default: `low`)
- `TZ` (optional, default: `Asia/Tokyo`)
- `PORT` (optional, default: `9876`)

`hono-cli-adapter` merges environment in this order: `process.env` < `options.env` < `--env KEY=VALUE`.


### Structure
- `src/search.ts`: Common OpenAI search core
- `src/env.ts`: Environment variable type definition
- `src/app.ts`: MCP Server (Tool) calling `runSearch()`
- `src/index.ts`: Hono app providing `POST /search` and `/mcp`
- `src/cli.ts`: Switches between CLI/serve/stdio via `hono-cli-adapter`

## Notes
- CLI normalizes `search <input>` into `POST /search { input }`.
- MCP Tool name: `gpt-web-search`.
- Core: OpenAI Responses API + `web_search_preview` tool.

### Publishing & `npm exec`
- This package exposes a `bin` entry (`xai-search`) that points to `dist/cli.js`.
- After publishing to npm, you can also run:
  - `OPENAI_API_KEY=sk-... npm exec xai-search -- search "..."`
  - or simply prefer `npx xai-search@latest ...` as shown above.


## License / Credits
- Main idea inspired by: https://github.com/yoshiko-pg/o3-search-mcp/
- CLI adapter: https://github.com/kiyo-e/hono-cli-adapter
