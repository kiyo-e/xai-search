import OpenAI from "openai";
import type { Env } from "./env";

export async function runSearch(input: string, env: Env): Promise<string> {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! });

  const response = await client.responses.create({
    model: env.OPENAI_MODEL || "gpt-5",
    input,
    tools: [
      {
        type: "web_search_preview",
        user_location: { type: "approximate", timezone: env.TZ || "Asia/Tokyo" },
        search_context_size: env.SEARCH_CONTEXT_SIZE || "medium",
      },
    ],
    tool_choice: "auto",
    parallel_tool_calls: true,
    reasoning: { effort: env.REASONING_EFFORT || "low" },
    store: false,
  });

  return response.output_text ?? "No response text available.";
}

