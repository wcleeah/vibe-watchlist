import { relations } from 'drizzle-orm'
import {
    boolean,
    decimal,
    foreignKey,
    integer,
    jsonb,
    pgTable,
    serial,
    text,
    timestamp,
} from 'drizzle-orm/pg-core'

// Removed videoPlatformEnum - now using dynamic platform IDs from platformConfigs table

export const videos = pgTable(
    'videos',
    {
        id: serial('id').primaryKey(),
        url: text('url').notNull().unique(),
        title: text('title'),
        platform: text('platform').notNull(), // Dynamic platform ID
        thumbnailUrl: text('thumbnail_url'),
        isWatched: boolean('is_watched').default(false),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        // Foreign key relationship to platformConfigs
        foreignKey({
            columns: [table.platform],
            foreignColumns: [platformConfigs.platformId],
            name: 'videos_platform_fkey',
        }).onDelete('restrict'), // Prevent deletion of referenced platforms
    ],
)

export const tags = pgTable('tags', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    color: text('color').default('#6b7280'), // Default gray color
    createdAt: timestamp('created_at').defaultNow(),
})

export const videoTags = pgTable('video_tags', {
    id: serial('id').primaryKey(),
    videoId: integer('video_id')
        .references(() => videos.id, { onDelete: 'cascade' })
        .notNull(),
    tagId: integer('tag_id')
        .references(() => tags.id, { onDelete: 'cascade' })
        .notNull(),
})

// User configuration storage for settings
export const userConfig = pgTable('user_config', {
    id: serial('id').primaryKey(),
    configKey: text('config_key').notNull().unique(),
    configValue: jsonb('config_value').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
})

// Analytics events for tracking usage
export const analyticsEvents = pgTable('analytics_events', {
    id: serial('id').primaryKey(),
    eventType: text('event_type').notNull(),
    eventData: jsonb('event_data'),
    userId: text('user_id'), // For future multi-user support
    sessionId: text('session_id'),
    createdAt: timestamp('created_at').defaultNow(),
})

// Platform configuration registry for dynamic platform support
export const platformConfigs = pgTable('platform_configs', {
    id: serial('id').primaryKey(),
    platformId: text('platform_id').notNull().unique(),
    name: text('name').notNull(),
    displayName: text('display_name').notNull(),
    patterns: text('patterns').array().notNull(),
    extractor: text('extractor').default('fallback'),
    color: text('color').default('#6b7280'),
    icon: text('icon').default('Video'),
    enabled: boolean('enabled').default(true),
    isPreset: boolean('is_preset').default(false),
    addedBy: text('added_by').default('system'),
    confidenceScore: decimal('confidence_score', {
        precision: 3,
        scale: 2,
    }).default('1.0'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
})

// AI metadata cache for expensive API calls
export const aiMetadataCache = pgTable('ai_metadata_cache', {
    id: serial('id').primaryKey(),
    url: text('url').notNull().unique(),
    searchResults: jsonb('search_results').notNull(),
    extractedMetadata: jsonb('extracted_metadata').notNull(), // Structured metadata instead of raw HTML
    aiAnalysis: jsonb('ai_analysis').notNull(),
    confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
})

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
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert
export type PlatformConfig = typeof platformConfigs.$inferSelect
export type NewPlatformConfig = typeof platformConfigs.$inferInsert
