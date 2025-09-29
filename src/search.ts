import type { Env } from "./env";

const DEFAULT_BASE_URL = "https://api.x.ai/v1";
const DEFAULT_MODEL = "grok-4-fast";
export const ALLOWED_SEARCH_PARAM_KEYS = [
  "mode",
  "return_citations",
  "max_search_results",
  "from_date",
  "to_date",
  "sources",
] as const;

export type AllowedSearchParamKey = typeof ALLOWED_SEARCH_PARAM_KEYS[number];

type FetchFn = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

type SearchMode = 'auto' | 'on' | 'off';

export interface SearchParams {
  mode?: SearchMode | string;
  return_citations?: boolean | 'true' | 'false';
  max_search_results?: number | string;
  from_date?: string;
  to_date?: string;
  sources?: SearchSource[] | SearchSource | string;
}
type SearchParamSource = SearchParams | URLSearchParams | Record<string, unknown>;

export type SearchSource =
  | { type: 'web'; profile?: string; mode?: SearchMode | string; country?: string; excluded_websites?: string[] | string; allowed_websites?: string[] | string; safe_search?: boolean | 'true' | 'false' }
  | { type: 'news'; profile?: string; mode?: SearchMode | string; country?: string; excluded_websites?: string[] | string; safe_search?: boolean | 'true' | 'false' }
  | { type: 'x'; profile?: string; mode?: SearchMode | string; included_x_handles?: string[] | string; excluded_x_handles?: string[] | string; post_view_count?: number | string; post_favorite_count?: number | string }
  | { type: 'rss'; links?: string[] | string; profile?: string; mode?: SearchMode | string }
  | { type: string; [key: string]: unknown };

const toParamRecord = (source: SearchParamSource): Record<string, unknown> => {
  if (source instanceof URLSearchParams) {
    return Object.fromEntries(source.entries());
  }
  return source as Record<string, unknown>;
};

const buildSourcesFromTypes = (input: string): SearchSource[] | undefined => {
  const tokens = input
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) return undefined;

  return tokens.map((type) => ({ type }));
};

const normalizeSources = (value: unknown): unknown => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) || (parsed && typeof parsed === "object")) {
        return parsed;
      }
      if (typeof parsed === "string") {
        return buildSourcesFromTypes(parsed);
      }
    } catch {
      const fromTokens = buildSourcesFromTypes(trimmed);
      if (fromTokens) return fromTokens;
      return value;
    }

    const fromTokens = buildSourcesFromTypes(trimmed);
    if (fromTokens) return fromTokens;
  }
  return value === undefined ? undefined : value;
};

export async function runSearch(input: string, env: Env, params: SearchParamSource): Promise<string> {
  const apiKey = env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing xAI API key. Set XAI_API_KEY to use Grok live search.");
  }

  const baseURL = env.XAI_BASE_URL || DEFAULT_BASE_URL;
  const url = baseURL.endsWith("/") ? `${baseURL}chat/completions` : `${baseURL}/chat/completions`;
  const searchParameters: Record<string, unknown> = {
    mode: env.GROK_SEARCH_MODE || "on",
  };

  const paramRecord = toParamRecord(params);

  for (const key of ALLOWED_SEARCH_PARAM_KEYS) {
    const value = paramRecord[key];
    if (value === undefined || value === null) continue;
    if (key === "sources") {
      const normalized = normalizeSources(value);
      if (normalized !== undefined) {
        searchParameters[key] = normalized;
      }
      continue;
    }
    searchParameters[key] = value;
  }

  const payload = {
    model: env.XAI_MODEL || DEFAULT_MODEL,
    messages: [{ role: "user", content: input }],
    search_parameters: searchParameters,
  };
  

  const fetchImpl: FetchFn | undefined = (globalThis as { fetch?: FetchFn }).fetch;
  if (!fetchImpl) {
    throw new Error("fetch is not available in this environment.");
  }

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok search request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string | Array<{ type?: string; text?: string }> };
    }>;
  };

  const message = data.choices?.[0]?.message;
  if (!message) return "No response text available.";

  if (typeof message.content === "string") {
    return message.content || "No response text available.";
  }

  if (!Array.isArray(message.content)) {
    return "No response text available.";
  }

  const text = message.content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        return part.text || "";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");

  return text || "No response text available.";
}
