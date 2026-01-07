import { relations } from "drizzle-orm/relations";
import { platformConfigs, videos, videoTags, tags } from "./schema";

export const videosRelations = relations(videos, ({one, many}) => ({
	platformConfig: one(platformConfigs, {
		fields: [videos.platform],
		references: [platformConfigs.platformId]
	}),
	videoTags: many(videoTags),
}));

export const platformConfigsRelations = relations(platformConfigs, ({many}) => ({
	videos: many(videos),
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
}));