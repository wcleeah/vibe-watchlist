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

// Platform configs must be defined first (referenced by videos and series)
export const platformConfigs = pgTable(
    'platform_configs',
    {
        id: serial('id').primaryKey(),
        platformId: text('platform_id').notNull(),
        name: text().notNull(),
        displayName: text('display_name').notNull(),
        patterns: text().array().notNull(),
        extractor: text().default('ai'),
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
        defaultMode: text('default_mode').default('video'), // 'video' | 'series'
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

// Playlists table for YouTube playlists
export const playlists = pgTable(
    'playlists',
    {
        id: serial('id').primaryKey(),
        youtubePlaylistId: text('youtube_playlist_id').notNull(),
        title: text(),
        description: text(),
        thumbnailUrl: text('thumbnail_url'),
        channelTitle: text('channel_title'),
        platform: text().notNull().default('youtube'),
        itemCount: integer('item_count').default(0),
        cascadeWatched: boolean('cascade_watched').default(true).notNull(),
        autoComplete: boolean('auto_complete').default(true).notNull(),
        sortOrder: integer('sort_order').default(0).notNull(),
        lastSyncedAt: timestamp('last_synced_at'),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        unique('playlists_youtube_playlist_id_unique').on(
            table.youtubePlaylistId,
        ),
        foreignKey({
            columns: [table.platform],
            foreignColumns: [platformConfigs.platformId],
            name: 'playlists_platform_fkey',
        }).onDelete('restrict'),
    ],
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
        // Playlist-related fields
        playlistId: integer('playlist_id'), // FK to playlists.id (null = standalone video)
        playlistIndex: integer('playlist_index'), // Position in playlist (0-based)
        youtubeVideoId: text('youtube_video_id'), // Extracted YouTube video ID
        sortOrder: integer('sort_order').default(0).notNull(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        foreignKey({
            columns: [table.platform],
            foreignColumns: [platformConfigs.platformId],
            name: 'videos_platform_fkey',
        }).onDelete('restrict'),
        foreignKey({
            columns: [table.playlistId],
            foreignColumns: [playlists.id],
            name: 'videos_playlist_fkey',
        }).onDelete('cascade'),
        index('videos_playlist_id_idx').on(table.playlistId),
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

// Series table for tracking recurring/episodic content
export const series = pgTable(
    'series',
    {
        id: serial('id').primaryKey(),
        url: text().notNull(),
        title: text(),
        description: text(),
        platform: text().notNull(),
        thumbnailUrl: text('thumbnail_url'),
        scheduleType: text('schedule_type').notNull(), // 'daily' | 'weekly' | 'custom' | 'none'
        scheduleValue: jsonb('schedule_value').notNull(), // { interval: number } or { days: string[] } or {}
        startDate: timestamp('start_date').notNull(),
        endDate: timestamp('end_date'),
        lastWatchedAt: timestamp('last_watched_at'),
        missedPeriods: integer('missed_periods').default(0).notNull(),
        nextEpisodeAt: timestamp('next_episode_at').notNull(),
        isActive: boolean('is_active').default(true).notNull(),
        // Episode progress tracking
        totalEpisodes: integer('total_episodes'), // nullable - not all series have known totals
        watchedEpisodes: integer('watched_episodes').default(0).notNull(),
        isWatched: boolean('is_watched').default(false).notNull(), // marks series as finished
        autoAdvanceTotalEpisodes: boolean('auto_advance_total_episodes')
            .default(false)
            .notNull(),
        hasSeasons: boolean('has_seasons').default(false).notNull(),
        sortOrder: integer('sort_order').default(0).notNull(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        foreignKey({
            columns: [table.platform],
            foreignColumns: [platformConfigs.platformId],
            name: 'series_platform_fkey',
        }).onDelete('restrict'),
        index('series_is_active_idx').on(table.isActive),
        index('series_next_episode_idx').on(table.nextEpisodeAt),
    ],
)

// Seasons table for multi-season series
export const seasons = pgTable(
    'seasons',
    {
        id: serial('id').primaryKey(),
        seriesId: integer('series_id').notNull(),
        seasonNumber: integer('season_number').notNull(),
        title: text(),
        url: text(),
        scheduleType: text('schedule_type').notNull(),
        scheduleValue: jsonb('schedule_value').notNull(),
        startDate: timestamp('start_date').notNull(),
        endDate: timestamp('end_date'),
        lastWatchedAt: timestamp('last_watched_at'),
        missedPeriods: integer('missed_periods').default(0).notNull(),
        nextEpisodeAt: timestamp('next_episode_at').notNull(),
        isActive: boolean('is_active').default(true).notNull(),
        totalEpisodes: integer('total_episodes'),
        watchedEpisodes: integer('watched_episodes').default(0).notNull(),
        isWatched: boolean('is_watched').default(false).notNull(),
        autoAdvanceTotalEpisodes: boolean('auto_advance_total_episodes')
            .default(false)
            .notNull(),
        sortOrder: integer('sort_order').default(0).notNull(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        foreignKey({
            columns: [table.seriesId],
            foreignColumns: [series.id],
            name: 'seasons_series_id_series_id_fk',
        }).onDelete('cascade'),
        unique('seasons_series_id_season_number_unique').on(
            table.seriesId,
            table.seasonNumber,
        ),
        index('seasons_series_id_idx').on(table.seriesId),
        index('seasons_is_active_idx').on(table.isActive),
        index('seasons_next_episode_idx').on(table.nextEpisodeAt),
    ],
)

// Series tags junction table
export const seriesTags = pgTable(
    'series_tags',
    {
        id: serial('id').primaryKey(),
        seriesId: integer('series_id').notNull(),
        tagId: integer('tag_id').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.seriesId],
            foreignColumns: [series.id],
            name: 'series_tags_series_id_series_id_fk',
        }).onDelete('cascade'),
        foreignKey({
            columns: [table.tagId],
            foreignColumns: [tags.id],
            name: 'series_tags_tag_id_tags_id_fk',
        }).onDelete('cascade'),
    ],
)

// Playlist tags junction table
export const playlistTags = pgTable(
    'playlist_tags',
    {
        id: serial('id').primaryKey(),
        playlistId: integer('playlist_id').notNull(),
        tagId: integer('tag_id').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.playlistId],
            foreignColumns: [playlists.id],
            name: 'playlist_tags_playlist_id_playlists_id_fk',
        }).onDelete('cascade'),
        foreignKey({
            columns: [table.tagId],
            foreignColumns: [tags.id],
            name: 'playlist_tags_tag_id_tags_id_fk',
        }).onDelete('cascade'),
    ],
)

// Coming Soon table for tracking unreleased videos/series
export const comingSoon = pgTable(
    'coming_soon',
    {
        id: serial('id').primaryKey(),
        url: text().notNull(), // Preview/trailer URL
        title: text(),
        platform: text().notNull(),
        thumbnailUrl: text('thumbnail_url'),
        releaseDate: timestamp('release_date').notNull(),
        transformedAt: timestamp('transformed_at'),
        sortOrder: integer('sort_order').default(0).notNull(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        foreignKey({
            columns: [table.platform],
            foreignColumns: [platformConfigs.platformId],
            name: 'coming_soon_platform_fkey',
        }).onDelete('restrict'),
        index('coming_soon_release_date_idx').on(table.releaseDate),
    ],
)

// Coming Soon tags junction table
export const comingSoonTags = pgTable(
    'coming_soon_tags',
    {
        id: serial('id').primaryKey(),
        comingSoonId: integer('coming_soon_id').notNull(),
        tagId: integer('tag_id').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.comingSoonId],
            foreignColumns: [comingSoon.id],
            name: 'coming_soon_tags_coming_soon_id_fk',
        }).onDelete('cascade'),
        foreignKey({
            columns: [table.tagId],
            foreignColumns: [tags.id],
            name: 'coming_soon_tags_tag_id_fk',
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
export const playlistsRelations = relations(playlists, ({ many }) => ({
    videos: many(videos),
    playlistTags: many(playlistTags),
}))

export const videosRelations = relations(videos, ({ one, many }) => ({
    videoTags: many(videoTags),
    playlist: one(playlists, {
        fields: [videos.playlistId],
        references: [playlists.id],
    }),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
    videoTags: many(videoTags),
    seriesTags: many(seriesTags),
    playlistTags: many(playlistTags),
    comingSoonTags: many(comingSoonTags),
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

export const seriesRelations = relations(series, ({ many }) => ({
    seriesTags: many(seriesTags),
    seasons: many(seasons),
}))

export const seasonsRelations = relations(seasons, ({ one }) => ({
    series: one(series, {
        fields: [seasons.seriesId],
        references: [series.id],
    }),
}))

export const seriesTagsRelations = relations(seriesTags, ({ one }) => ({
    series: one(series, {
        fields: [seriesTags.seriesId],
        references: [series.id],
    }),
    tag: one(tags, {
        fields: [seriesTags.tagId],
        references: [tags.id],
    }),
}))

export const playlistTagsRelations = relations(playlistTags, ({ one }) => ({
    playlist: one(playlists, {
        fields: [playlistTags.playlistId],
        references: [playlists.id],
    }),
    tag: one(tags, {
        fields: [playlistTags.tagId],
        references: [tags.id],
    }),
}))

export const comingSoonRelations = relations(comingSoon, ({ many }) => ({
    comingSoonTags: many(comingSoonTags),
}))

export const comingSoonTagsRelations = relations(comingSoonTags, ({ one }) => ({
    comingSoon: one(comingSoon, {
        fields: [comingSoonTags.comingSoonId],
        references: [comingSoon.id],
    }),
    tag: one(tags, {
        fields: [comingSoonTags.tagId],
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
export type Series = typeof series.$inferSelect
export type NewSeries = typeof series.$inferInsert
export type SeriesTag = typeof seriesTags.$inferSelect
export type NewSeriesTag = typeof seriesTags.$inferInsert
export type Playlist = typeof playlists.$inferSelect
export type NewPlaylist = typeof playlists.$inferInsert
export type PlaylistTag = typeof playlistTags.$inferSelect
export type NewPlaylistTag = typeof playlistTags.$inferInsert
export type ComingSoon = typeof comingSoon.$inferSelect
export type NewComingSoon = typeof comingSoon.$inferInsert
export type ComingSoonTag = typeof comingSoonTags.$inferSelect
export type NewComingSoonTag = typeof comingSoonTags.$inferInsert
export type Season = typeof seasons.$inferSelect
export type NewSeason = typeof seasons.$inferInsert
