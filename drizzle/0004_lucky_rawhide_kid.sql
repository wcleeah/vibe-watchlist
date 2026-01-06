CREATE TABLE "ai_metadata_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"search_results" jsonb NOT NULL,
	"html_content" text NOT NULL,
	"ai_analysis" jsonb NOT NULL,
	"confidence_score" numeric(3, 2),
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "ai_metadata_cache_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "metadata_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"suggestions" jsonb NOT NULL,
	"selected_index" integer,
	"user_feedback" text,
	"created_at" timestamp DEFAULT now()
);
