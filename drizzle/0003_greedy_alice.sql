CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"user_id" text,
	"session_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_id" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"patterns" text[] NOT NULL,
	"extractor" text DEFAULT 'fallback',
	"color" text DEFAULT '#6b7280',
	"icon" text DEFAULT 'Video',
	"enabled" boolean DEFAULT true,
	"is_preset" boolean DEFAULT false,
	"added_by" text DEFAULT 'system',
	"confidence_score" numeric(3, 2) DEFAULT '1.0',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "platform_configs_platform_id_unique" UNIQUE("platform_id")
);
--> statement-breakpoint
CREATE TABLE "user_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_key" text NOT NULL,
	"config_value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_config_config_key_unique" UNIQUE("config_key")
);
