export interface Env {
  XAI_API_KEY?: string
  XAI_MODEL?: string
  XAI_BASE_URL?: string
  GROK_SEARCH_MODE?: 'auto' | 'on' | 'off'
  GROK_SEARCH_RETURN_CITATIONS?: string
  TZ?: string
  PORT?: string
}
