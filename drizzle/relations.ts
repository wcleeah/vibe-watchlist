import { relations } from "drizzle-orm/relations";
import { platformConfigs, videos, playlists, videoTags, tags, comingSoon, comingSoonTags, series, seasons, seriesConfig, seriesTags, playlistTags } from "./schema";

export const videosRelations = relations(videos, ({one, many}) => ({
	platformConfig: one(platformConfigs, {
		fields: [videos.platform],
		references: [platformConfigs.platformId]
	}),
	playlist: one(playlists, {
		fields: [videos.playlistId],
		references: [playlists.id]
	}),
	videoTags: many(videoTags),
}));

export const platformConfigsRelations = relations(platformConfigs, ({many}) => ({
	videos: many(videos),
	comingSoons: many(comingSoon),
	playlists: many(playlists),
	series: many(series),
}));

export const playlistsRelations = relations(playlists, ({one, many}) => ({
	videos: many(videos),
	playlistTags: many(playlistTags),
	platformConfig: one(platformConfigs, {
		fields: [playlists.platform],
		references: [platformConfigs.platformId]
	}),
}));

export const videoTagsRelations = relations(videoTags, ({one}) => ({
	video: one(videos, {
		fields: [videoTags.videoId],
		references: [videos.id]
	}),
	tag: one(tags, {
		fields: [videoTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	videoTags: many(videoTags),
	comingSoonTags: many(comingSoonTags),
	seriesTags: many(seriesTags),
	playlistTags: many(playlistTags),
}));

export const comingSoonTagsRelations = relations(comingSoonTags, ({one}) => ({
	comingSoon: one(comingSoon, {
		fields: [comingSoonTags.comingSoonId],
		references: [comingSoon.id]
	}),
	tag: one(tags, {
		fields: [comingSoonTags.tagId],
		references: [tags.id]
	}),
}));

export const comingSoonRelations = relations(comingSoon, ({one, many}) => ({
	comingSoonTags: many(comingSoonTags),
	platformConfig: one(platformConfigs, {
		fields: [comingSoon.platform],
		references: [platformConfigs.platformId]
	}),
}));

export const seasonsRelations = relations(seasons, ({one}) => ({
	series: one(series, {
		fields: [seasons.seriesId],
		references: [series.id]
	}),
}));

export const seriesRelations = relations(series, ({one, many}) => ({
	seasons: many(seasons),
	seriesConfigs: many(seriesConfig),
	seriesTags: many(seriesTags),
	platformConfig: one(platformConfigs, {
		fields: [series.platform],
		references: [platformConfigs.platformId]
	}),
}));

export const seriesConfigRelations = relations(seriesConfig, ({one}) => ({
	series: one(series, {
		fields: [seriesConfig.seriesId],
		references: [series.id]
	}),
}));

export const seriesTagsRelations = relations(seriesTags, ({one}) => ({
	series: one(series, {
		fields: [seriesTags.seriesId],
		references: [series.id]
	}),
	tag: one(tags, {
		fields: [seriesTags.tagId],
		references: [tags.id]
	}),
}));

export const playlistTagsRelations = relations(playlistTags, ({one}) => ({
	playlist: one(playlists, {
		fields: [playlistTags.playlistId],
		references: [playlists.id]
	}),
	tag: one(tags, {
		fields: [playlistTags.tagId],
		references: [tags.id]
	}),
}));