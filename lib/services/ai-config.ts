// ── AI configuration constants & types ──────────────────────────────────────
// This module is safe to import from both server and client code because it has
// no dependencies on server-only modules (database, Node APIs, etc.).

// ── Default values (reused by seed script + settings UI reset) ──────────────

export const DEFAULT_MODEL_ID = 'arcee-ai/trinity-large-preview:free'

export const DEFAULT_PLATFORM_DETECTION_SYSTEM_PROMPT = [
    'You infer the hosting platform for a video URL.',
    'Use only URL evidence such as the domain, subdomain, path, and query structure.',
    'Prefer exact known platform and domain matches.',
    'If the platform is unclear, return "unknown" with lower confidence instead of guessing.',
    'Put the URL clues you used into "patterns".',
    '"color" must be a valid 6-digit hex color.',
    '"icon" should be a short lowercase icon keyword that fits the platform, or "globe" if generic.',
    'Return only valid JSON matching the required schema.',
].join(' ')

export const DEFAULT_PLATFORM_DETECTION_USER_PROMPT_TEMPLATE = `Analyze this video URL and return the most likely platform details.

URL: {url}`

export const DEFAULT_TITLE_SUGGESTION_SYSTEM_PROMPT = [
    'You extract canonical video titles from noisy page metadata and HTML context.',
    'Start with the provided context.',
    'If the title is missing, ambiguous, inconsistent, or clearly decorated with site branding, use the available Exa web tools to verify the canonical title.',
    'Remove only non-title noise such as site names, platform names, channel or uploader suffixes, and decorative separators when they are clearly not part of the actual title.',
    'Preserve original language and spelling.',
    'Do not translate, summarize, or invent titles.',
    'If strong evidence shows multiple language variants for the same video, return each as a separate suggestion.',
    'Prefer evidence from the target URL, canonical pages, and official platform pages.',
    'Return only valid JSON matching the required schema.',
].join(' ')

export const DEFAULT_TITLE_SUGGESTION_USER_PROMPT_TEMPLATE = `Analyze the JSON context below and return the clean video title suggestion set.

Instructions:
- Start with the provided metadata and HTML snippet.
- Use the available Exa web tools only when the existing evidence is missing, ambiguous, inconsistent, or heavily decorated.
- Prefer evidence from the target URL, canonical pages, official platform pages, and strong exact-match results.
- Clean titles by removing site branding, platform names, channel or uploader names, and decorative separators only when they are clearly not part of the title.
- Keep language variants only when they are supported by evidence.
- Deduplicate equivalent cleaned titles.
- "source" should be short and concrete, such as "og:title", "title tag", "meta", "html", "official page", or "exa search".
- "bestGuess" must be the single most likely clean title.
- If evidence is weak, lower confidence instead of guessing.

Rules:
- Do not translate titles.
- Do not fabricate titles, languages, or sources.
- Do not return unrelated page headings.
- If only one credible cleaned title exists, return one suggestion.

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
