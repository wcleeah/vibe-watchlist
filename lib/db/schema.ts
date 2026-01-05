import { pgTable, serial, text, boolean, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const videoPlatformEnum = pgEnum('video_platform', ['youtube', 'netflix', 'nebula', 'twitch', 'unknown']);

export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title'),
  platform: videoPlatformEnum('platform').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  isWatched: boolean('is_watched').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').default('#6b7280'), // Default gray color
  createdAt: timestamp('created_at').defaultNow(),
});

export const videoTags = pgTable('video_tags', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
});

// Relations
export const videosRelations = relations(videos, ({ many }) => ({
  videoTags: many(videoTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  videoTags: many(videoTags),
}));

export const videoTagsRelations = relations(videoTags, ({ one }) => ({
  video: one(videos, {
    fields: [videoTags.videoId],
    references: [videos.id],
  }),
  tag: one(tags, {
    fields: [videoTags.tagId],
    references: [tags.id],
  }),
}));

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type VideoTag = typeof videoTags.$inferSelect;
export type NewVideoTag = typeof videoTags.$inferInsert;