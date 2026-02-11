#!/usr/bin/env bun

/**
 * Migration Script: HKT Date Normalization
 *
 * This script migrates all date fields to proper HKT timezone handling:
 * 1. Converts startDate and endDate from date type to timestamp
 * 2. Ensures all timestamps are properly normalized to HKT
 * 3. Updates nextEpisodeAt calculations to be consistent
 *
 * Run this script with: bun run scripts/migrate-hkt-dates.ts
 */

import { sql } from 'drizzle-orm'
import { db } from '../lib/db'
import { series } from '../lib/db/schema'

// HKT timezone constant
const HKT_TIMEZONE = 'Asia/Hong_Kong'

/**
 * Convert a date to HKT timezone components
 */
function toHKTComponents(date: Date): {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
} {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: HKT_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })

    const parts = formatter.formatToParts(date)
    const getPart = (type: string): string =>
        parts.find((p) => p.type === type)?.value || '0'

    return {
        year: parseInt(getPart('year')),
        month: parseInt(getPart('month')) - 1, // 0-indexed
        day: parseInt(getPart('day')),
        hour: parseInt(getPart('hour')),
        minute: parseInt(getPart('minute')),
        second: parseInt(getPart('second')),
    }
}

/**
 * Convert a date to HKT timestamp
 */
function toHKTTimestamp(date: Date | string): Date {
    const inputDate = typeof date === 'string' ? new Date(date) : date
    const hkt = toHKTComponents(inputDate)

    return new Date(
        hkt.year,
        hkt.month,
        hkt.day,
        hkt.hour,
        hkt.minute,
        hkt.second,
    )
}

/**
 * Get end of day in HKT for a given date
 */
function getEndOfHKTDay(date: Date): Date {
    const hkt = toHKTComponents(date)
    return new Date(hkt.year, hkt.month, hkt.day, 23, 59, 59, 999)
}

/**
 * Check if date is the sentinel date
 */
function isSentinelDate(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.getFullYear() === 9999 && d.getMonth() === 11 && d.getDate() === 31
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('='.repeat(60))
    console.log('HKT Date Migration Script')
    console.log('='.repeat(60))
    console.log()

    // Step 1: Migrate database schema (date -> timestamp)
    console.log('Step 1: Migrating schema (date -> timestamp)...')
    try {
        // Convert start_date from date to timestamp
        await db.execute(sql`
            ALTER TABLE series 
            ALTER COLUMN start_date TYPE TIMESTAMP 
            USING start_date::timestamp
        `)
        console.log('  ✓ Converted start_date to timestamp')

        // Convert end_date from date to timestamp (nullable)
        await db.execute(sql`
            ALTER TABLE series 
            ALTER COLUMN end_date TYPE TIMESTAMP 
            USING end_date::timestamp
        `)
        console.log('  ✓ Converted end_date to timestamp')
    } catch (error) {
        console.error('  ✗ Schema migration failed:', error)
        throw error
    }
    console.log()

    // Step 2: Get all series
    console.log('Step 2: Fetching all series...')
    const allSeries = await db.select().from(series)
    console.log(`  Found ${allSeries.length} series to process`)
    console.log()

    // Step 3: Update dates to proper HKT format
    console.log('Step 3: Normalizing dates to HKT timezone...')
    let updated = 0
    let skipped = 0
    let errors = 0

    for (const s of allSeries) {
        try {
            const updates: {
                startDate?: Date
                endDate?: Date
                nextEpisodeAt?: Date
            } = {}

            // Skip sentinel dates (backlog series)
            if (isSentinelDate(s.nextEpisodeAt)) {
                console.log(
                    `  Series ${s.id}: Skipping (backlog/sentinel date)`,
                )
                skipped++
                continue
            }

            // Convert startDate to HKT (start of day)
            if (s.startDate) {
                const hktStart = toHKTTimestamp(s.startDate)
                // Set to start of day in HKT
                const hkt = toHKTComponents(hktStart)
                updates.startDate = new Date(
                    hkt.year,
                    hkt.month,
                    hkt.day,
                    0,
                    0,
                    0,
                )
            }

            // Convert endDate to HKT (end of day)
            if (s.endDate) {
                updates.endDate = getEndOfHKTDay(s.endDate)
            }

            // Normalize nextEpisodeAt to HKT
            if (s.nextEpisodeAt) {
                updates.nextEpisodeAt = toHKTTimestamp(s.nextEpisodeAt)
            }

            // Only update if there are changes
            if (Object.keys(updates).length > 0) {
                await db
                    .update(series)
                    .set(updates)
                    .where(sql`${series.id} = ${s.id}`)

                console.log(`  Series ${s.id}: Updated dates to HKT`)
                updated++
            } else {
                skipped++
            }
        } catch (error) {
            console.error(`  Series ${s.id}: Error updating -`, error)
            errors++
        }
    }

    console.log()
    console.log('='.repeat(60))
    console.log('Migration Complete!')
    console.log('='.repeat(60))
    console.log(`  Updated: ${updated}`)
    console.log(`  Skipped: ${skipped}`)
    console.log(`  Errors:  ${errors}`)
    console.log()
}

// Run migration
migrate()
    .then(() => {
        console.log('Migration completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Migration failed:', error)
        process.exit(1)
    })
