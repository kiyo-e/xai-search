# Repository Guidelines

## Project Structure & Module Organization
- `src/cli.ts` boots CLI/HTTP/MCP modes, delegating to `src/app.ts`, `src/index.ts`, and shared env helpers.
- `src/app.ts` wires the Hono app to search logic in `src/search.ts` and typed config from `src/env.ts`.
- Build products land in `dist/` (npm package) and `bin/` (compiled binary); keep `dist/cli.js` in sync with sources.
- Architecture notes live in `docs/design/live-search.md`; read before altering request/response contracts.
- Cloudflare Worker settings sit in `wrangler.jsonc` and `worker-configuration.d.ts`.

## Build, Test, and Development Commands
- `bun install` or `npm install` matches the pinned `packageManager`.
- `npm run build` emits `dist/cli.js`; run before publishing or committing CLI changes.
- `npm run cli -- search "<query>"` drives the CLI; `npm run cli:serve` hosts HTTP+MCP on port 9876 (`PORT=...` overrides).
- `npm run dev` starts Wrangler locally; `npm run deploy` pushes a minified worker.
- `npm run build:bin` or `npm run build:bin:release` generate the standalone binary in `bin/`.

## Coding Style & Naming Conventions
- TypeScript modules use ES modules, two-space indentation, and prefer `const`; group related helpers in the same file.
- Filenames stay kebab-case; exported symbols use camelCase, while types and classes use PascalCase.
- Keep HTTP routes, CLI options, and environment keys lowercase to align with Hono and CLI adapters.
- Run `bun fmt` (or your editor formatter) before opening a PR; avoid unrelated whitespace churn.

## Testing Guidelines
- No automated tests yet—add Bun tests in `src/__tests__/` or adjacent `.test.ts` files as features grow.
- `bun test` (and `bun test --coverage`) is the preferred runner; stub Grok HTTP calls to keep tests deterministic.
- Mirror command names in describe blocks and cover CLI flag parsing plus Hono route responses.

## Commit & Pull Request Guidelines
- Write short, sentence-style commits (see `git log`), leading with the impact, e.g. `Improve search error handling`.
- Squash noisy work-in-progress commits or use `--amend` for quick fixes.
- PRs should describe user-facing changes, call out required env vars, and link issues or design docs.
- Include CLI snippets or HTTP examples when behavior changes; screenshots only when terminal output meaningfully shifts.

## Environment & Secrets
- Required: `XAI_API_KEY`; optional overrides include `XAI_MODEL`, `XAI_BASE_URL`, `GROK_SEARCH_MODE`, and `PORT`.
- Store secrets in shell exports or `.env.local`; never commit credentials. Cloudflare deployments read from project secrets.
