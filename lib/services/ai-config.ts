// ── AI configuration constants & types ──────────────────────────────────────
// This module is safe to import from both server and client code because it has
// no dependencies on server-only modules (database, Node APIs, etc.).

// ── Default values (reused by seed script + settings UI reset) ──────────────

export const DEFAULT_MODEL_ID = 'arcee-ai/trinity-large-preview:free'

export const DEFAULT_PLATFORM_DETECTION_SYSTEM_PROMPT =
    'You are a helpful assistant that analyzes video URLs, metadatas, google search result. You can returns structured platform information. Always respond with valid JSON that matches the required schema.'

export const DEFAULT_PLATFORM_DETECTION_USER_PROMPT_TEMPLATE =
    'Analyze this URL and suggest platform details: {url}'

export const DEFAULT_TITLE_SUGGESTION_SYSTEM_PROMPT =
    'You are a video title extraction assistant. You analyze video page metadata, HTML tags, and Google search results to determine the actual video title. Metadata titles often contain extra text like site names, platform names, channel names, or decorative markers (e.g. "Video Title - SiteName", "Video Title | ChannelName - Platform"). Your job is to extract the clean video title, stripping away these suffixes and prefixes. When the same video title appears in multiple languages across the provided data, return each language variant as a separate suggestion. Do NOT translate titles \u2014 only return language variants you find evidence for in the data. Always respond with valid JSON matching the required schema.'

export const DEFAULT_TITLE_SUGGESTION_USER_PROMPT_TEMPLATE = `Analyze the context below and extract the actual video title(s).

For each title found:
- Extract the clean video title, removing site names, platform suffixes, channel names, and decorative text (e.g. "Video Title - SiteName" should become "Video Title")
- Identify the language code (e.g. "en", "zh-TW", "ja", "ko", or "unknown" if uncertain)
- Rate your confidence (0-1) that this is the actual video title
- Note the source where you found evidence (e.g. "og:title", "google search", "page title")

Rules:
- Cross-reference metadata titles with Google search result titles to identify the common video title portion
- Strip site names, platform names, channel names, and other suffixes/prefixes that are not part of the video title
- Do NOT translate or fabricate titles not present in the data
- Deduplicate titles that are identical after cleaning and trimming
- If multiple languages are found in the data, return each as a separate suggestion
- bestGuess should be the most likely clean video title

Context:
{context}`

// ── Config key names ────────────────────────────────────────────────────────

export const CONFIG_KEY_AI_MODEL = 'ai_model'
export const CONFIG_KEY_AI_PROMPT_PLATFORM_DETECTION =
    'ai_prompt_platform_detection'
export const CONFIG_KEY_AI_PROMPT_TITLE_SUGGESTION =
    'ai_prompt_title_suggestion'

// ── Config value types ──────────────────────────────────────────────────────

export interface AIModelConfig {
    modelId: string
}

export interface AIPromptConfig {
    systemPrompt: string
    userPromptTemplate: string
}
