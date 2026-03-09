import {
    boolean,
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

export const aiMetadataCache = pgTable(
    'ai_metadata_cache',
    {
        id: serial().primaryKey().notNull(),
        url: text().notNull(),
        searchResults: jsonb('search_results').notNull(),
        extractedMetadata: jsonb('extracted_metadata').notNull(),
        aiAnalysis: jsonb('ai_analysis').notNull(),
        confidenceScore: numeric('confidence_score', {
            precision: 3,
            scale: 2,
        }),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
        expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    },
    (table) => [unique('ai_metadata_cache_url_unique').on(table.url)],
)

export const videos = pgTable(
    'videos',
    {
        id: serial().primaryKey().notNull(),
        url: text().notNull(),
        title: text(),
        platform: text().notNull(),
        thumbnailUrl: text('thumbnail_url'),
        isWatched: boolean('is_watched').default(false),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
        playlistId: integer('playlist_id'),
        playlistIndex: integer('playlist_index'),
        youtubeVideoId: text('youtube_video_id'),
        sortOrder: integer('sort_order').default(0).notNull(),
    },
    (table) => [
        index('videos_playlist_id_idx').using(
            'btree',
            table.playlistId.asc().nullsLast().op('int4_ops'),
        ),
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
    ],
)

export const platformConfigs = pgTable(
    'platform_configs',
    {
        id: serial().primaryKey().notNull(),
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
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
        defaultMode: text('default_mode').default('video'),
    },
    (table) => [
        unique('platform_configs_platform_id_unique').on(table.platformId),
    ],
)

export const userConfig = pgTable(
    'user_config',
    {
        id: serial().primaryKey().notNull(),
        configKey: text('config_key').notNull(),
        configValue: jsonb('config_value').notNull(),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
    },
    (table) => [unique('user_config_config_key_unique').on(table.configKey)],
)

export const tags = pgTable(
    'tags',
    {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        color: text().default('#6b7280'),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    },
    (table) => [unique('tags_name_unique').on(table.name)],
)

export const videoTags = pgTable(
    'video_tags',
    {
        id: serial().primaryKey().notNull(),
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

export const comingSoonTags = pgTable(
    'coming_soon_tags',
    {
        id: serial().primaryKey().notNull(),
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

export const comingSoon = pgTable(
    'coming_soon',
    {
        id: serial().primaryKey().notNull(),
        url: text().notNull(),
        title: text(),
        platform: text().notNull(),
        thumbnailUrl: text('thumbnail_url'),
        releaseDate: timestamp('release_date', { mode: 'string' }).notNull(),
        sortOrder: integer('sort_order').default(0).notNull(),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
        transformedAt: timestamp('transformed_at', { mode: 'string' }),
    },
    (table) => [
        index('coming_soon_release_date_idx').using(
            'btree',
            table.releaseDate.asc().nullsLast().op('timestamp_ops'),
        ),
        foreignKey({
            columns: [table.platform],
            foreignColumns: [platformConfigs.platformId],
            name: 'coming_soon_platform_fkey',
        }).onDelete('restrict'),
    ],
)

export const seasons = pgTable(
    'seasons',
    {
        id: serial().primaryKey().notNull(),
        seriesId: integer('series_id').notNull(),
        seasonNumber: integer('season_number').notNull(),
        title: text(),
        url: text(),
        scheduleType: text('schedule_type').notNull(),
        scheduleValue: jsonb('schedule_value').notNull(),
        startDate: timestamp('start_date', { mode: 'string' }).notNull(),
        endDate: timestamp('end_date', { mode: 'string' }),
        lastWatchedAt: timestamp('last_watched_at', { mode: 'string' }),
        nextEpisodeAt: timestamp('next_episode_at', {
            mode: 'string',
        }).notNull(),
        isActive: boolean('is_active').default(true).notNull(),
        isWatched: boolean('is_watched').default(false).notNull(),
        sortOrder: integer('sort_order').default(0).notNull(),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
        episodesAired: integer('episodes_aired').default(0).notNull(),
        episodesRemaining: integer('episodes_remaining'),
        episodesWatched: integer('episodes_watched').default(0).notNull(),
    },
    (table) => [
        index('seasons_is_active_idx').using(
            'btree',
            table.isActive.asc().nullsLast().op('bool_ops'),
        ),
        index('seasons_next_episode_idx').using(
            'btree',
            table.nextEpisodeAt.asc().nullsLast().op('timestamp_ops'),
        ),
        index('seasons_series_id_idx').using(
            'btree',
            table.seriesId.asc().nullsLast().op('int4_ops'),
        ),
        foreignKey({
            columns: [table.seriesId],
            foreignColumns: [series.id],
            name: 'seasons_series_id_series_id_fk',
        }).onDelete('cascade'),
        unique('seasons_series_id_season_number_unique').on(
            table.seriesId,
            table.seasonNumber,
        ),
    ],
)

export const seriesConfig = pgTable(
    'series_config',
    {
        id: serial().primaryKey().notNull(),
        seriesId: integer('series_id').notNull(),
        scheduleType: text('schedule_type').notNull(),
        scheduleValue: jsonb('schedule_value').notNull(),
        startDate: timestamp('start_date', { mode: 'string' }).notNull(),
        endDate: timestamp('end_date', { mode: 'string' }),
        lastWatchedAt: timestamp('last_watched_at', { mode: 'string' }),
        nextEpisodeAt: timestamp('next_episode_at', {
            mode: 'string',
        }).notNull(),
        isActive: boolean('is_active').default(true).notNull(),
        episodesAired: integer('episodes_aired').default(0).notNull(),
        episodesRemaining: integer('episodes_remaining'),
        episodesWatched: integer('episodes_watched').default(0).notNull(),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
    },
    (table) => [
        index('series_config_is_active_idx').using(
            'btree',
            table.isActive.asc().nullsLast().op('bool_ops'),
        ),
        index('series_config_next_episode_idx').using(
            'btree',
            table.nextEpisodeAt.asc().nullsLast().op('timestamp_ops'),
        ),
        foreignKey({
            columns: [table.seriesId],
            foreignColumns: [series.id],
            name: 'series_config_series_id_series_id_fk',
        }).onDelete('cascade'),
        unique('series_config_series_id_unique').on(table.seriesId),
    ],
)

export const apiUsageStats = pgTable(
    'api_usage_stats',
    {
        id: serial().primaryKey().notNull(),
        operationType: text('operation_type').notNull(),
        promptTokens: integer('prompt_tokens').notNull(),
        completionTokens: integer('completion_tokens').notNull(),
        totalTokens: integer('total_tokens').notNull(),
        model: text().notNull(),
        promptText: text('prompt_text'),
        completionText: text('completion_text'),
        durationMs: integer('duration_ms'),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    },
    (table) => [
        index('api_usage_created_idx').using(
            'btree',
            table.createdAt.asc().nullsLast().op('timestamp_ops'),
        ),
        index('api_usage_operation_idx').using(
            'btree',
            table.operationType.asc().nullsLast().op('text_ops'),
        ),
    ],
)

export const seriesTags = pgTable(
    'series_tags',
    {
        id: serial().primaryKey().notNull(),
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

export const playlistTags = pgTable(
    'playlist_tags',
    {
        id: serial().primaryKey().notNull(),
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

export const playlists = pgTable(
    'playlists',
    {
        id: serial().primaryKey().notNull(),
        youtubePlaylistId: text('youtube_playlist_id').notNull(),
        title: text(),
        description: text(),
        thumbnailUrl: text('thumbnail_url'),
        channelTitle: text('channel_title'),
        itemCount: integer('item_count').default(0),
        lastSyncedAt: timestamp('last_synced_at', { mode: 'string' }),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
        platform: text().default('youtube').notNull(),
        sortOrder: integer('sort_order').default(0).notNull(),
        cascadeWatched: boolean('cascade_watched').default(true).notNull(),
        autoComplete: boolean('auto_complete').default(true).notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.platform],
            foreignColumns: [platformConfigs.platformId],
            name: 'playlists_platform_fkey',
        }).onDelete('restrict'),
        unique('playlists_youtube_playlist_id_unique').on(
            table.youtubePlaylistId,
        ),
    ],
)

export const series = pgTable(
    'series',
    {
        id: serial().primaryKey().notNull(),
        url: text().notNull(),
        title: text(),
        platform: text().notNull(),
        thumbnailUrl: text('thumbnail_url'),
        createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
        isWatched: boolean('is_watched').default(false).notNull(),
        sortOrder: integer('sort_order').default(0).notNull(),
        hasSeasons: boolean('has_seasons').default(false).notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.platform],
            foreignColumns: [platformConfigs.platformId],
            name: 'series_platform_fkey',
        }).onDelete('restrict'),
    ],
)
