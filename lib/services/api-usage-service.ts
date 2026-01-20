import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { apiUsageStats } from '@/lib/db/schema'
import type { UsageRequest, UsageSummary } from '@/lib/types/usage'

export class APIUsageService {
    static async log(
        operation: string,
        tokens: { prompt: number; completion: number; total: number },
        model: string,
        promptText?: string,
        completionText?: string,
        durationMs?: number,
    ): Promise<void> {
        try {
            await db.insert(apiUsageStats).values({
                operationType: operation,
                promptTokens: tokens.prompt,
                completionTokens: tokens.completion,
                totalTokens: tokens.total,
                model,
                promptText: promptText || null,
                completionText: completionText || null,
                durationMs: durationMs || null,
            })
        } catch (error) {
            console.error('Failed to log API usage:', error)
        }
    }

    static async getSummary(): Promise<UsageSummary> {
        const result = await db
            .select({
                totalRequests: sql<number>`count(*)`,
                totalPromptTokens: sql<number>`coalesce(sum(${apiUsageStats.promptTokens}), 0)`,
                totalCompletionTokens: sql<number>`coalesce(sum(${apiUsageStats.completionTokens}), 0)`,
                totalTokens: sql<number>`coalesce(sum(${apiUsageStats.totalTokens}), 0)`,
                operationType: apiUsageStats.operationType,
                operationPromptTokens: sql<number>`coalesce(sum(${apiUsageStats.promptTokens}), 0)`,
                operationCompletionTokens: sql<number>`coalesce(sum(${apiUsageStats.completionTokens}), 0)`,
                operationTotalTokens: sql<number>`coalesce(sum(${apiUsageStats.totalTokens}), 0)`,
                operationRequests: sql<number>`count(*)`,
            })
            .from(apiUsageStats)
            .groupBy(apiUsageStats.operationType)

        const summary: UsageSummary = {
            totalRequests: 0,
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            totalTokens: 0,
            byOperation: {},
        }

        for (const row of result) {
            const op = row.operationType || 'unknown'
            summary.byOperation[op] = {
                requests: Number(row.operationRequests) || 0,
                promptTokens: Number(row.operationPromptTokens) || 0,
                completionTokens: Number(row.operationCompletionTokens) || 0,
                totalTokens: Number(row.operationTotalTokens) || 0,
            }
            summary.totalRequests += Number(row.totalRequests) || 0
            summary.totalPromptTokens += Number(row.totalPromptTokens) || 0
            summary.totalCompletionTokens +=
                Number(row.totalCompletionTokens) || 0
            summary.totalTokens += Number(row.totalTokens) || 0
        }

        return summary
    }

    static async getRequests(
        operation?: string | null,
        limit = 25,
        offset = 0,
    ): Promise<UsageRequest[]> {
        const conditions = operation
            ? [eq(apiUsageStats.operationType, operation)]
            : []

        const result = await db
            .select({
                id: apiUsageStats.id,
                operation: apiUsageStats.operationType,
                promptTokens: apiUsageStats.promptTokens,
                completionTokens: apiUsageStats.completionTokens,
                totalTokens: apiUsageStats.totalTokens,
                model: apiUsageStats.model,
                promptText: apiUsageStats.promptText,
                completionText: apiUsageStats.completionText,
                durationMs: apiUsageStats.durationMs,
                createdAt: apiUsageStats.createdAt,
            })
            .from(apiUsageStats)
            .where(conditions.length > 0 ? conditions[0] : undefined)
            .orderBy(desc(apiUsageStats.createdAt))
            .limit(limit)
            .offset(offset)

        return result.map((row) => ({
            id: row.id,
            operation: row.operation || 'unknown',
            promptTokens: row.promptTokens || 0,
            completionTokens: row.completionTokens || 0,
            totalTokens: row.totalTokens || 0,
            model: row.model || 'unknown',
            promptText: row.promptText,
            completionText: row.completionText,
            durationMs: row.durationMs,
            createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
        }))
    }

    static async getRequestById(id: number): Promise<UsageRequest | null> {
        const result = await db
            .select({
                id: apiUsageStats.id,
                operation: apiUsageStats.operationType,
                promptTokens: apiUsageStats.promptTokens,
                completionTokens: apiUsageStats.completionTokens,
                totalTokens: apiUsageStats.totalTokens,
                model: apiUsageStats.model,
                promptText: apiUsageStats.promptText,
                completionText: apiUsageStats.completionText,
                durationMs: apiUsageStats.durationMs,
                createdAt: apiUsageStats.createdAt,
            })
            .from(apiUsageStats)
            .where(eq(apiUsageStats.id, id))
            .limit(1)

        if (result.length === 0) {
            return null
        }

        const row = result[0]
        return {
            id: row.id,
            operation: row.operation || 'unknown',
            promptTokens: row.promptTokens || 0,
            completionTokens: row.completionTokens || 0,
            totalTokens: row.totalTokens || 0,
            model: row.model || 'unknown',
            promptText: row.promptText,
            completionText: row.completionText,
            durationMs: row.durationMs,
            createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
        }
    }
}
