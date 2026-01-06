import { pgTable, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const videoPlatform = pgEnum("video_platform", ['youtube', 'netflix', 'nebula', 'twitch', 'unknown'])



