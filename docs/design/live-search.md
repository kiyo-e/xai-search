# Live Search Architecture

This note tracks how the Grok 4 Fast live search capability is plumbed through the CLI, HTTP server, and MCP tool. Keep it in sync with `src/search.ts`, `src/app.ts`, and `src/index.ts` whenever you add request fields or change transports.

## Runtime Surfaces

- CLI: `npm run cli -- search "<query>"` (or `npm run search`) routes through `src/cli.ts`, which in turn invokes the Hono router defined in `src/index.ts`.
- HTTP: `POST /search/:input` handled by the same Hono app; the JSON body is forwarded as search parameters.
- MCP: `src/app.ts` registers a tool named `xai-web-search`. `src/cli.ts --stdio` exposes it over stdio, while `/mcp` in `src/index.ts` serves the streaming HTTP transport via `@hono/mcp`.

All three transports delegate to `runSearch` in `src/search.ts` for the actual call to the xAI API. They differ only in how they collect the `input` string and optional search parameter overrides.

## Search Parameters

`runSearch(input, env, params)` whitelists and forwards the following keys under `search_parameters` in the xAI payload:

| Key | Accepted Types | Behaviour |
| --- | --- | --- |
| `mode` | `"auto" | "on" | "off"` plus arbitrary strings | Overrides live search mode. Defaults to `env.GROK_SEARCH_MODE` or `"on"`.
| `return_citations` | boolean, `'true'`, `'false'` | Requests citation metadata when supported by the model.
| `max_search_results` | number or numeric string | Caps the number of web results Grok should retrieve.
| `from_date` / `to_date` | ISO 8601 date strings | Lower/upper bounds applied to search results.
| `sources` | object, array, JSON string, or comma/space separated list | Customises the search corpus (see below).

`sources` accepts rich structures per the `SearchSource` union in `src/search.ts`:

- `type: "web" | "news" | "x" | "rss" | <string>` with optional fields such as `profile`, `mode`, and source-specific filters (`allowed_websites`, `included_x_handles`, etc.).
- When a string is provided, the normaliser first attempts JSON parsing; if that fails it splits on commas/whitespace and emits `{ type: token }` entries.
- Empty strings resolve to `undefined` so they do not reach the API.

Any parameter outside this allowlist is ignored, keeping the Grok call resilient to noisy input.

## Request Pipeline

1. Transport collects `input` and (optionally) additional parameters and passes them to `runSearch`.
2. `runSearch` merges environment defaults with the caller-supplied overrides and builds the payload:
   ```ts
   {
     model: env.XAI_MODEL ?? "grok-4-fast",
     messages: [{ role: "user", content: input }],
     search_parameters: { mode: env.GROK_SEARCH_MODE ?? "on", ...overrides }
   }
   ```
3. Requests are `POST`ed to `${env.XAI_BASE_URL ?? "https://api.x.ai/v1"}/chat/completions` with `Bearer ${env.XAI_API_KEY}`.
4. Non-2xx responses bubble up with the HTTP status and raw body text to aid debugging.

The global `fetch` provided by Node/Bun is required; error messaging guides the user when it is unavailable.

## Response Normalisation

- Grok responses that already return string content are passed through directly.
- When the API returns an array of content parts, `runSearch` concatenates the `text` fields with newlines.
- If no content is present, the helper returns the placeholder string `"No response text available."`. Callers can rely on always receiving a string.

## Configuration

- `XAI_API_KEY` (required): authentication token for the xAI API.
- `XAI_MODEL` (optional): overrides the model name; defaults to `grok-4-fast`.
- `XAI_BASE_URL` (optional): switches the API origin, preserving the `/chat/completions` suffix.
- `GROK_SEARCH_MODE` (optional): establishes the default search mode before per-request overrides.
- `PORT` (optional): controls the HTTP listener when running `npm run cli:serve`; defaults to `9876`.

Additional env vars can be introduced, but update this section and the `Env` type in `src/env.ts` alongside code changes.

## Error Handling Expectations

- Missing `XAI_API_KEY` causes `runSearch` to throw synchronously with a descriptive setup hint.
- Downstream failures (network, 4xx/5xx with bodies) propagate to CLI/HTTP/MCP callers so client UX can decide how to surface them.

Refer to the official xAI API documentation for the full set of `search_parameters` recognised by the service. Extend `ALLOWED_SEARCH_PARAM_KEYS` if you need to pass through new fields.
