import { relations } from "drizzle-orm/relations";
import { videos, videoTags, tags } from "./schema";

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

export const videosRelations = relations(videos, ({many}) => ({
	videoTags: many(videoTags),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	videoTags: many(videoTags),
}));