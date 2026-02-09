import { relations } from 'drizzle-orm/relations'
import {
    platformConfigs,
    playlists,
    playlistTags,
    series,
    seriesTags,
    tags,
    videos,
    videoTags,
} from './schema'

export const videosRelations = relations(videos, ({ one, many }) => ({
    platformConfig: one(platformConfigs, {
        fields: [videos.platform],
        references: [platformConfigs.platformId],
    }),
    playlist: one(playlists, {
        fields: [videos.playlistId],
        references: [playlists.id],
    }),
    videoTags: many(videoTags),
}))

export const platformConfigsRelations = relations(
    platformConfigs,
    ({ many }) => ({
        videos: many(videos),
        series: many(series),
        playlists: many(playlists),
    }),
)

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
    videos: many(videos),
    playlistTags: many(playlistTags),
    platformConfig: one(platformConfigs, {
        fields: [playlists.platform],
        references: [platformConfigs.platformId],
    }),
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

export const tagsRelations = relations(tags, ({ many }) => ({
    videoTags: many(videoTags),
    seriesTags: many(seriesTags),
    playlistTags: many(playlistTags),
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

export const seriesRelations = relations(series, ({ one, many }) => ({
    seriesTags: many(seriesTags),
    platformConfig: one(platformConfigs, {
        fields: [series.platform],
        references: [platformConfigs.platformId],
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
