export interface UsageSummary {
    totalRequests: number
    totalPromptTokens: number
    totalCompletionTokens: number
    totalTokens: number
    byOperation: Record<
        string,
        {
            requests: number
            promptTokens: number
            completionTokens: number
            totalTokens: number
        }
    >
}

export interface UsageRequest {
    id: number
    operation: string
    promptTokens: number
    completionTokens: number
    totalTokens: number
    model: string
    promptText: string | null
    completionText: string | null
    durationMs: number | null
    createdAt: string
}

export type UsageStatsResponse = {
    summary: UsageSummary
    requests: UsageRequest[]
}

export type OperationType =
    | 'platform_detection'
    | 'title_suggestion'
    | 'metadata_quality'
