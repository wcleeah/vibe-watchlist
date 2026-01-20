import { relations } from 'drizzle-orm'
import {
    boolean,
    decimal,
    foreignKey,
    index,
    integer,
    jsonb,
    numeric,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
} from 'drizzle-orm/pg-core'

// Platform configs must be defined first (referenced by videos)
export const platformConfigs = pgTable(
    'platform_configs',
    {
        id: serial('id').primaryKey(),
        platformId: text('platform_id').notNull(),
        name: text().notNull(),
        displayName: text('display_name').notNull(),
        patterns: text().array().notNull(),
        extractor: text().default('fallback'),
        color: text().default('#6b7280'),
        icon: text().default('Video'),
        enabled: boolean().default(true),
        isPreset: boolean('is_preset').default(false),
        addedBy: text('added_by').default('system'),
        confidenceScore: numeric('confidence_score', {
            precision: 3,
            scale: 2,
        }).default('1.0'),
        metadata: jsonb(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        unique('platform_configs_platform_id_unique').on(table.platformId),
    ],
)

// AI metadata cache (referenced by relations)
export const aiMetadataCache = pgTable(
    'ai_metadata_cache',
    {
        id: serial('id').primaryKey(),
        url: text().notNull(),
        searchResults: jsonb('search_results').notNull(),
        extractedMetadata: jsonb('extracted_metadata').notNull(), // Structured metadata instead of raw HTML
        aiAnalysis: jsonb('ai_analysis').notNull(),
        confidenceScore: decimal('confidence_score', {
            precision: 3,
            scale: 2,
        }),
        createdAt: timestamp('created_at').defaultNow(),
        expiresAt: timestamp('expires_at').notNull(),
    },
    (table) => [unique('ai_metadata_cache_url_unique').on(table.url)],
)

// Tags (referenced by videoTags)
export const tags = pgTable(
    'tags',
    {
        id: serial('id').primaryKey(),
        name: text().notNull(),
        color: text().default('#6b7280'),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => [unique('tags_name_unique').on(table.name)],
)

// Videos (referenced by videoTags)
export const videos = pgTable(
    'videos',
    {
        id: serial('id').primaryKey(),
        url: text().notNull(),
        title: text(),
        platform: text().notNull(),
        thumbnailUrl: text('thumbnail_url'),
        isWatched: boolean('is_watched').default(false),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        foreignKey({
            columns: [table.platform],
            foreignColumns: [platformConfigs.platformId],
            name: 'videos_platform_fkey',
        }).onDelete('restrict'),
    ],
)

// Video tags junction table
export const videoTags = pgTable(
    'video_tags',
    {
        id: serial('id').primaryKey(),
        videoId: integer('video_id').notNull(),
        tagId: integer('tag_id').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.videoId],
            foreignColumns: [videos.id],
            name: 'video_tags_video_id_videos_id_fk',
        }).onDelete('cascade'),
        foreignKey({
            columns: [table.tagId],
            foreignColumns: [tags.id],
            name: 'video_tags_tag_id_tags_id_fk',
        }).onDelete('cascade'),
    ],
)

export const userConfig = pgTable(
    'user_config',
    {
        id: serial('id').primaryKey(),
        configKey: text('config_key').notNull(),
        configValue: jsonb('config_value').notNull(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [unique('user_config_config_key_unique').on(table.configKey)],
)

export const apiUsageStats = pgTable(
    'api_usage_stats',
    {
        id: serial('id').primaryKey(),
        operationType: text('operation_type').notNull(),
        promptTokens: integer('prompt_tokens').notNull(),
        completionTokens: integer('completion_tokens').notNull(),
        totalTokens: integer('total_tokens').notNull(),
        model: text().notNull(),
        promptText: text('prompt_text'),
        completionText: text('completion_text'),
        durationMs: integer('duration_ms'),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => [
        index('api_usage_operation_idx').on(table.operationType),
        index('api_usage_created_idx').on(table.createdAt),
    ],
)

// Relations
export const videosRelations = relations(videos, ({ many }) => ({
    videoTags: many(videoTags),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
    videoTags: many(videoTags),
}))

export const videoTagsRelations = relations(videoTags, ({ one }) => ({
    video: one(videos, {
        fields: [videoTags.videoId],
        references: [videos.id],
    }),
    tag: one(tags, {
        fields: [videoTags.tagId],
        references: [tags.id],
    }),
}))

export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert
export type Tag = typeof tags.$inferSelect
export type AIMetadataCache = typeof aiMetadataCache.$inferSelect
export type NewAIMetadataCache = typeof aiMetadataCache.$inferInsert

export type NewTag = typeof tags.$inferInsert
export type VideoTag = typeof videoTags.$inferSelect
export type NewVideoTag = typeof videoTags.$inferInsert
export type UserConfig = typeof userConfig.$inferSelect
export type NewUserConfig = typeof userConfig.$inferInsert
export type PlatformConfig = typeof platformConfigs.$inferSelect
export type NewPlatformConfig = typeof platformConfigs.$inferInsert
export type APIUsageStat = typeof apiUsageStats.$inferSelect
export type NewAPIUsageStat = typeof apiUsageStats.$inferInsert
