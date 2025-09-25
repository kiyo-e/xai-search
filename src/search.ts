import type { Env } from "./env";

const DEFAULT_BASE_URL = "https://api.x.ai/v1";
const DEFAULT_MODEL = "grok-4-fast";
const ALLOWED_SEARCH_PARAM_KEYS = [
  "mode",
  "return_citations",
  "max_search_results",
  "from_date",
  "to_date",
] as const;

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
}
type SearchParamSource = SearchParams | URLSearchParams | Record<string, unknown>;

export async function runSearch(input: string, env: Env, params: SearchParamSource): Promise<string> {
  const apiKey = env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing xAI API key. Set XAI_API_KEY to use Grok live search.");
  }

  const baseURL = env.XAI_BASE_URL || DEFAULT_BASE_URL;
  const url = baseURL.endsWith("/") ? `${baseURL}chat/completions` : `${baseURL}/chat/completions`;
  const searchParameters: Record<string, unknown> = {
    mode: env.GROK_SEARCH_MODE || "auto",
  };

  for (const key of ALLOWED_SEARCH_PARAM_KEYS) {
    const value = params[key];
    if (value !== undefined) {
      searchParameters[key] = value;
    }
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
