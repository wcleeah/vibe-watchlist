#!/usr/bin/env bun

/**
 * Seed Script: AI Configuration Defaults
 *
 * Inserts the default AI model and prompt configuration into the user_config table.
 * Uses ON CONFLICT DO NOTHING so it's safe to run multiple times (idempotent).
 *
 * Run with: bun run scripts/seed-ai-config.ts
 */

import { db } from '../lib/db'
import { userConfig } from '../lib/db/schema'
import type { AIModelConfig, AIPromptConfig } from '../lib/services/ai-config'
import {
    CONFIG_KEY_AI_MODEL,
    CONFIG_KEY_AI_PROMPT_PLATFORM_DETECTION,
    CONFIG_KEY_AI_PROMPT_TITLE_SUGGESTION,
    DEFAULT_MODEL_ID,
    DEFAULT_PLATFORM_DETECTION_SYSTEM_PROMPT,
    DEFAULT_PLATFORM_DETECTION_USER_PROMPT_TEMPLATE,
    DEFAULT_TITLE_SUGGESTION_SYSTEM_PROMPT,
    DEFAULT_TITLE_SUGGESTION_USER_PROMPT_TEMPLATE,
} from '../lib/services/ai-config'

const configs: Array<{
    configKey: string
    configValue: AIModelConfig | AIPromptConfig
}> = [
    {
        configKey: CONFIG_KEY_AI_MODEL,
        configValue: { modelId: DEFAULT_MODEL_ID },
    },
    {
        configKey: CONFIG_KEY_AI_PROMPT_PLATFORM_DETECTION,
        configValue: {
            systemPrompt: DEFAULT_PLATFORM_DETECTION_SYSTEM_PROMPT,
            userPromptTemplate: DEFAULT_PLATFORM_DETECTION_USER_PROMPT_TEMPLATE,
        },
    },
    {
        configKey: CONFIG_KEY_AI_PROMPT_TITLE_SUGGESTION,
        configValue: {
            systemPrompt: DEFAULT_TITLE_SUGGESTION_SYSTEM_PROMPT,
            userPromptTemplate: DEFAULT_TITLE_SUGGESTION_USER_PROMPT_TEMPLATE,
        },
    },
]

async function seed() {
    console.log('='.repeat(60))
    console.log('AI Configuration Seed Script')
    console.log('='.repeat(60))
    console.log()

    let inserted = 0
    let skipped = 0

    for (const config of configs) {
        try {
            const result = await db
                .insert(userConfig)
                .values({
                    configKey: config.configKey,
                    configValue: config.configValue,
                })
                .onConflictDoNothing({
                    target: userConfig.configKey,
                })

            if (result.rowCount && result.rowCount > 0) {
                console.log(`  Inserted: ${config.configKey}`)
                inserted++
            } else {
                console.log(`  Skipped (already exists): ${config.configKey}`)
                skipped++
            }
        } catch (error) {
            console.error(`  Error inserting ${config.configKey}:`, error)
        }
    }

    console.log()
    console.log('='.repeat(60))
    console.log('Seed Complete!')
    console.log('='.repeat(60))
    console.log(`  Inserted: ${inserted}`)
    console.log(`  Skipped:  ${skipped}`)
    console.log()
}

seed()
    .then(() => {
        console.log('Seed completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Seed failed:', error)
        process.exit(1)
    })
