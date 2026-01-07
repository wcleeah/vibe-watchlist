import { pgTable, unique, serial, text, jsonb, numeric, timestamp, foreignKey, boolean, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const aiMetadataCache = pgTable("ai_metadata_cache", {
	id: serial().primaryKey().notNull(),
	url: text().notNull(),
	searchResults: jsonb("search_results").notNull(),
	extractedMetadata: jsonb("extracted_metadata").notNull(),
	aiAnalysis: jsonb("ai_analysis").notNull(),
	confidenceScore: numeric("confidence_score", { precision: 3, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("ai_metadata_cache_url_unique").on(table.url),
]);

export const analyticsEvents = pgTable("analytics_events", {
	id: serial().primaryKey().notNull(),
	eventType: text("event_type").notNull(),
	eventData: jsonb("event_data"),
	userId: text("user_id"),
	sessionId: text("session_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const videos = pgTable("videos", {
	id: serial().primaryKey().notNull(),
	url: text().notNull(),
	title: text(),
	platform: text().notNull(),
	thumbnailUrl: text("thumbnail_url"),
	isWatched: boolean("is_watched").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.platform],
			foreignColumns: [platformConfigs.platformId],
			name: "videos_platform_fkey"
		}).onDelete("restrict"),
	unique("videos_url_unique").on(table.url),
]);

export const platformConfigs = pgTable("platform_configs", {
	id: serial().primaryKey().notNull(),
	platformId: text("platform_id").notNull(),
	name: text().notNull(),
	displayName: text("display_name").notNull(),
	patterns: text().array().notNull(),
	extractor: text().default('fallback'),
	color: text().default('#6b7280'),
	icon: text().default('Video'),
	enabled: boolean().default(true),
	isPreset: boolean("is_preset").default(false),
	addedBy: text("added_by").default('system'),
	confidenceScore: numeric("confidence_score", { precision: 3, scale:  2 }).default('1.0'),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("platform_configs_platform_id_unique").on(table.platformId),
]);

export const userConfig = pgTable("user_config", {
	id: serial().primaryKey().notNull(),
	configKey: text("config_key").notNull(),
	configValue: jsonb("config_value").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("user_config_config_key_unique").on(table.configKey),
]);

export const tags = pgTable("tags", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	color: text().default('#6b7280'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("tags_name_unique").on(table.name),
]);

export const videoTags = pgTable("video_tags", {
	id: serial().primaryKey().notNull(),
	videoId: integer("video_id").notNull(),
	tagId: integer("tag_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.videoId],
			foreignColumns: [videos.id],
			name: "video_tags_video_id_videos_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "video_tags_tag_id_tags_id_fk"
		}).onDelete("cascade"),
]);
