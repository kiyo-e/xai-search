# Live Search Architecture

This document summarizes how the Grok 4 Fast live search integration is wired into the application. It is a companion note for maintainers who need to adjust search behaviour or rotate API credentials.

## Components

- `src/search.ts` builds the request payload for the Grok 4 Fast model and normalizes the response text.
- `src/app.ts` exposes the Model Context Protocol tool that proxies search requests into the HTTP and stdio transports.
- `src/index.ts` registers HTTP routes for the search endpoint and the MCP server.

## Configuration

- `XAI_API_KEY` authenticates requests to `https://api.x.ai/v1`.
- Optional environment variables prefixed with `GROK_SEARCH_` adjust the default search mode and citation flag.
- Per-request overrides for `maxResults`, `fromDate`, and `toDate` are accepted via the HTTP/CLI parameters described in the application routes.

Refer to the xAI API documentation for details on supported search parameters and models.
