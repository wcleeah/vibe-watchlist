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

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
  }

  async detectPlatform(url: string): Promise<PlatformSuggestion> {
    try {
      const prompt = `Analyze this URL and suggest platform details in JSON format:
URL: ${url}

Please respond with valid JSON only, no additional text. Format:
{
  "platform": "platform_name",
  "confidence": 0.95,
  "patterns": ["domain.com", "sub.domain.com"],
  "color": "#hexcolor",
  "icon": "IconName"
}

Common platforms: youtube, twitch, netflix, nebula, vimeo, dailymotion, bilibili, etc.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Video Watchlist App',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid AI response format');
      }

      const content = data.choices[0].message.content.trim();

      // Try to extract JSON from response
      let jsonContent = content;
      if (content.includes('```json')) {
        const match = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonContent = match[1];
      }

      const suggestion = JSON.parse(jsonContent);

      // Validate the response structure
      if (!suggestion.platform || typeof suggestion.confidence !== 'number') {
        throw new Error('Invalid AI response structure');
      }

      return suggestion;

    } catch (error) {
      console.error('AI platform detection failed:', error);
      throw error;
    }
  }

  async generateTitleSuggestions(metadata: { url?: string; title?: string; platform?: string }, searchResults: unknown[] = []): Promise<TitleSuggestions> {
    try {
      const context = {
        url: metadata.url,
        existingTitle: metadata.title,
        searchResults: searchResults.slice(0, 3), // Limit to first 3 results
        platform: metadata.platform,
      };

      const prompt = `Analyze this video metadata and suggest better titles. Return JSON only.

Context: ${JSON.stringify(context, null, 2)}

Please suggest 3-5 title variations with confidence scores. Format:
{
  "suggestions": [
    {"title": "Suggested Title 1", "confidence": 0.95, "source": "reason"},
    {"title": "Suggested Title 2", "confidence": 0.85, "source": "reason"}
  ],
  "bestGuess": "Best suggested title",
  "alternatives": ["Alternative 1", "Alternative 2"]
}`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Video Watchlist App',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      // Extract JSON
      let jsonContent = content;
      if (content.includes('```json')) {
        const match = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonContent = match[1];
      }

      const suggestions = JSON.parse(jsonContent);

      // Validate structure
      if (!suggestions.suggestions || !Array.isArray(suggestions.suggestions)) {
        throw new Error('Invalid suggestions format');
      }

      return suggestions;

    } catch (error) {
      console.error('AI title suggestions failed:', error);
      // Return fallback suggestions
      return {
        suggestions: [{
          title: metadata.title || 'Untitled Video',
          confidence: 0.5,
          source: 'fallback',
        }],
        bestGuess: metadata.title || 'Untitled Video',
        alternatives: [],
      };
    }
  }

  async analyzeMetadataQuality(metadata: { url?: string; title?: string; platform?: string }): Promise<{
    quality: 'high' | 'medium' | 'low';
    issues: string[];
    suggestions: string[];
  }> {
    try {
      const prompt = `Analyze the quality of this video metadata and suggest improvements:

Metadata: ${JSON.stringify(metadata, null, 2)}

Return JSON with quality assessment and suggestions.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      const analysis = JSON.parse(content.includes('```json')
        ? content.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || content
        : content);

      return {
        quality: analysis.quality || 'medium',
        issues: analysis.issues || [],
        suggestions: analysis.suggestions || [],
      };

    } catch (error) {
      console.error('AI metadata analysis failed:', error);
      return {
        quality: 'medium',
        issues: ['AI analysis unavailable'],
        suggestions: ['Manual review recommended'],
      };
    }
  }
}

export const aiService = new AIService();