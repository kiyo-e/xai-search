## gpt-search

An implementation sample that uses one Hono-based application code to support four modes:

- CLI (local execution)
- Remote MCP (HTTP /mcp)
- Local MCP (stdio)
- HTTP API (/search)

Core behavior is inspired by:
- https://github.com/yoshiko-pg/o3-search-mcp/


### Structure
- `src/search.ts`: Common OpenAI search core
- `src/env.ts`: Environment variable type definition
- `src/app.ts`: MCP Server (Tool) calling `runSearch()`
- `src/index.ts`: Hono app providing `POST /search` and `/mcp`
- `src/cli.ts`: Switches between CLI/serve/stdio via `hono-cli-adapter`


### Requirements
- Node.js 18+ (or Bun)
- OpenAI API Key (`OPENAI_API_KEY`)


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


## Usage

### 1) CLI (recommended)
Use `search <input>`. Add `--json` for pretty JSON wrapping.

```bash
# via npm
OPENAI_API_KEY=sk-... npm run cli -- search "Rust learning roadmap"

# direct with Bun
OPENAI_API_KEY=sk-... bun src/cli.ts search "Next.js image optimization"

# shortcut
OPENAI_API_KEY=sk-... npm run search -- "Supabase RLS basics"
```


### 2) HTTP server (local)
Expose `/search` by running `serve` mode.

```bash
OPENAI_API_KEY=sk-... npm run cli:serve

# POST /search
curl -sS -X POST localhost:9876/search \
  --json '{"input":"Next.js image optimization"}'
```


### 3) Local MCP (stdio)
Connect from an MCP client via stdio.

```bash
OPENAI_API_KEY=sk-... npm run cli:stdio
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
npm run build:bin   # -> bin/gpt-search

# release-like (minify)
npm run build:bin:release  # -> bin/gpt-search

# run example
OPENAI_API_KEY=sk-... ./bin/gpt-search search "Compare LLMs"
```


## Notes
- CLI normalizes `search <input>` into `POST /search { input }`.
- MCP Tool name: `gpt-web-search`.
- Core: OpenAI Responses API + `web_search_preview` tool.


## License / Credits
- Main idea inspired by: https://github.com/yoshiko-pg/o3-search-mcp/
- CLI adapter: https://github.com/kiyo-e/hono-cli-adapter
