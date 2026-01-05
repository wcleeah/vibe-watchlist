CREATE TYPE "public"."video_platform" AS ENUM('youtube', 'netflix', 'nebula', 'twitch');--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"platform" "video_platform" NOT NULL,
	"thumbnail_url" text,
	"is_watched" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "videos_url_unique" UNIQUE("url")
);
