export interface PlatformSuggestion {
    platform: string;
    confidence: number;
    patterns: string[];
    color: string;
    icon: string;
}

export interface TitleSuggestions {
    suggestions: Array<{
        title: string;
        confidence: number;
        source: string;
    }>;
    bestGuess: string;
    alternatives: string[];
}

// JSON Schemas for structured output
const platformSuggestionSchema = {
    type: "object",
    properties: {
        platform: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        patterns: { type: "array", items: { type: "string" } },
        color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        icon: { type: "string" },
    },
    required: ["platform", "confidence", "patterns", "color", "icon"],
    additionalProperties: false,
};

const titleSuggestionsSchema = {
    type: "object",
    properties: {
        suggestions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    source: { type: "string" },
                },
                required: ["title", "confidence", "source"],
                additionalProperties: false,
            },
            minItems: 1,
            maxItems: 5,
        },
        bestGuess: { type: "string" },
        alternatives: { type: "array", items: { type: "string" } },
    },
    required: ["suggestions", "bestGuess", "alternatives"],
    additionalProperties: false,
};

const metadataQualitySchema = {
    type: "object",
    properties: {
        quality: { type: "string", enum: ["high", "medium", "low"] },
        issues: { type: "array", items: { type: "string" } },
        suggestions: { type: "array", items: { type: "string" } },
    },
    required: ["quality", "issues", "suggestions"],
    additionalProperties: false,
};

export class AIService {
    private apiKey: string;
    private baseUrl = "https://openrouter.ai/api/v1";

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY!;
        if (!this.apiKey) {
            throw new Error(
                "OPENROUTER_API_KEY environment variable is required",
            );
        }
    }

    async detectPlatform(url: string): Promise<PlatformSuggestion> {
        try {
            console.log("🤖 AI PLATFORM DETECTION: Analyzing URL:", url);

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer":
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "http://localhost:3000",
                    "X-Title": "Video Watchlist App",
                },
                body: JSON.stringify({
                    model: "mistralai/devstral-2512:free",
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a helpful assistant that analyzes video URLs, metadatas, google search result. You can returns structured platform information. Always respond with valid JSON that matches the required schema.",
                        },
                        {
                            role: "user",
                            content: `Analyze this URL and suggest platform details: ${url}`,
                        },
                    ],
                    provider: {
                        require_parameters: true,
                    },
                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "platform_suggestion",
                            schema: platformSuggestionSchema,
                            strict: true,
                        },
                    },
                }),
            });

            if (!response.ok) {
                console.log(
                    "🤖 AI PLATFORM DETECTION: API request failed with status:",
                    response.status,
                    response.statusText,
                );

                // Log response body for debugging
                try {
                    const errorBody = await response.text();
                    console.log(
                        "🤖 AI PLATFORM DETECTION: Error response body:",
                        errorBody.substring(0, 500),
                    );
                } catch (bodyError) {
                    console.log(
                        "🤖 AI PLATFORM DETECTION: Could not read error response body:",
                        bodyError,
                    );
                }

                throw new Error(
                    `AI service error: ${response.status} ${response.statusText}`,
                );
            }

            const data = await response.json();
            console.log(
                "🤖 AI PLATFORM DETECTION: API response:",
                JSON.stringify(data, null, 2),
            );

            if (!data.choices?.[0]?.message?.content) {
                throw new Error("Invalid AI response format");
            }

            // Parse the structured JSON response directly
            const suggestion: PlatformSuggestion = JSON.parse(
                data.choices[0].message.content,
            );

            // Validate the response structure (TypeScript will help, but double-check)
            if (
                !suggestion.platform ||
                typeof suggestion.confidence !== "number" ||
                !Array.isArray(suggestion.patterns)
            ) {
                console.error(
                    "🤖 AI PLATFORM DETECTION: Invalid response structure:",
                    suggestion,
                );
                throw new Error("Invalid AI response structure");
            }

            console.log(
                "🤖 AI PLATFORM DETECTION: Successfully parsed structured response:",
                suggestion,
            );
            return suggestion;
        } catch (error) {
            console.error("🤖 AI PLATFORM DETECTION: Failed:", error);
            throw error;
        }
    }

    async generateTitleSuggestions(
        metadata: { url?: string; title?: string; platform?: string },
        searchResults: unknown[] = [],
    ): Promise<TitleSuggestions> {
        try {
            const context = {
                url: metadata.url,
                existingTitle: metadata.title,
                searchResults: searchResults.slice(0, 3), // Limit to first 3 results
                platform: metadata.platform,
            };
            console.log(
                "🤖 AI TITLE SUGGESTIONS: context:",
                JSON.stringify(context, null, 2),
            );

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer":
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "http://localhost:3000",
                    "X-Title": "Video Watchlist App",
                },
                body: JSON.stringify({
                    model: "mistralai/devstral-2512:free",
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a helpful assistant that analyzes video URLs, metadatas, google search result. You can returns structured platform information. Always respond with valid JSON that matches the required schema.",
                        },
                        {
                            role: "user",
                            content: `Analyze this video metadata and suggeest the actual titles:\n\n${JSON.stringify(context, null, 2)}`,
                        },
                    ],
                    provider: {
                        require_parameters: true,
                    },
                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "title_suggestions",
                            schema: titleSuggestionsSchema,
                            strict: true,
                        },
                    },
                }),
            });

            if (!response.ok) {
                console.log(
                    "🤖 AI TITLE SUGGESTIONS: API request failed with status:",
                    response.status,
                );

                // Log response body for debugging
                try {
                    const errorBody = await response.text();
                    console.log(
                        "🤖 AI TITLE SUGGESTIONS: Error response body:",
                        errorBody.substring(0, 500),
                    );
                } catch (bodyError) {
                    console.log(
                        "🤖 AI TITLE SUGGESTIONS: Could not read error response body:",
                        bodyError,
                    );
                }

                throw new Error(`AI service error: ${response.status}`);
            }

            const data = await response.json();
            console.log(
                "🤖 AI TITLE SUGGESTIONS: API response:",
                JSON.stringify(data, null, 2),
            );

            if (!data.choices?.[0]?.message?.content) {
                throw new Error("Invalid AI response format");
            }

            // Parse the structured JSON response directly
            const suggestions: TitleSuggestions = JSON.parse(
                data.choices[0].message.content,
            );

            // Validate structure
            if (
                !suggestions.suggestions ||
                !Array.isArray(suggestions.suggestions) ||
                suggestions.suggestions.length === 0
            ) {
                console.error(
                    "🤖 AI TITLE SUGGESTIONS: Invalid response structure:",
                    suggestions,
                );
                throw new Error("Invalid suggestions format");
            }

            console.log(
                "🤖 AI TITLE SUGGESTIONS: Successfully parsed structured response:",
                JSON.stringify(suggestions, null, 2),
            );
            return suggestions;
        } catch (error) {
            console.error("🤖 AI TITLE SUGGESTIONS: Failed:", error);
            // Return fallback suggestions
            return {
                suggestions: [
                    {
                        title: metadata.title || "Untitled Video",
                        confidence: 0.5,
                        source: "fallback",
                    },
                ],
                bestGuess: metadata.title || "Untitled Video",
                alternatives: [],
            };
        }
    }

    async analyzeMetadataQuality(metadata: {
        url?: string;
        title?: string;
        platform?: string;
    }): Promise<{
        quality: "high" | "medium" | "low";
        issues: string[];
        suggestions: string[];
    }> {
        try {
            console.log(
                "🤖 AI METADATA QUALITY: Analyzing metadata:",
                JSON.stringify(metadata, null, 2),
            );

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer":
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "http://localhost:3000",
                    "X-Title": "Video Watchlist App",
                },
                body: JSON.stringify({
                    model: "mistralai/devstral-2512:free",
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a helpful assistant that analyzes video metadata quality and provides improvement suggestions. Always respond with valid JSON that matches the required schema.",
                        },
                        {
                            role: "user",
                            content: `Analyze the quality of this video metadata and suggest improvements:\n\n${JSON.stringify(metadata, null, 2)}`,
                        },
                    ],
                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "metadata_quality_analysis",
                            schema: metadataQualitySchema,
                            strict: true,
                        },
                    },
                    max_tokens: 300,
                    temperature: 0.1,
                }),
            });

            if (!response.ok) {
                console.log(
                    "🤖 AI METADATA QUALITY: API request failed with status:",
                    response.status,
                );

                // Log response body for debugging
                try {
                    const errorBody = await response.text();
                    console.log(
                        "🤖 AI METADATA QUALITY: Error response body:",
                        errorBody.substring(0, 500),
                    );
                } catch (bodyError) {
                    console.log(
                        "🤖 AI METADATA QUALITY: Could not read error response body:",
                        bodyError,
                    );
                }

                throw new Error(`AI service error: ${response.status}`);
            }

            const data = await response.json();
            console.log(
                "🤖 AI METADATA QUALITY: API response:",
                JSON.stringify(data, null, 2),
            );

            if (!data.choices?.[0]?.message?.content) {
                throw new Error("Invalid AI response format");
            }

            // Parse the structured JSON response directly
            const analysis = JSON.parse(data.choices[0].message.content);

            // Validate and provide defaults
            const result = {
                quality:
                    (analysis.quality as "high" | "medium" | "low") || "medium",
                issues: Array.isArray(analysis.issues) ? analysis.issues : [],
                suggestions: Array.isArray(analysis.suggestions)
                    ? analysis.suggestions
                    : [],
            };

            console.log(
                "🤖 AI METADATA QUALITY: Successfully parsed structured response:",
                JSON.stringify(result, null, 2),
            );
            return result;
        } catch (error) {
            console.error("🤖 AI METADATA QUALITY: Failed:", error);
            return {
                quality: "medium",
                issues: ["AI analysis unavailable"],
                suggestions: ["Manual review recommended"],
            };
        }
    }
}

export const aiService = new AIService();
