export interface Env {
  OPENAI_MODEL?: string
  OPENAI_API_KEY: string
  SEARCH_CONTEXT_SIZE?: 'low' | 'medium' | 'high'
  REASONING_EFFORT?: 'low' | 'medium' | 'high'
  TZ?: string
  PORT?: string
}

