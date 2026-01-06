import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userConfig } from '@/lib/db/schema';

export async function GET() {
  try {
    const configs = await db.select().from(userConfig);
    return NextResponse.json({ success: true, data: configs });
  } catch (error) {
    console.error('Failed to fetch user config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();

    // Validate input
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Process updates - can be a single config or multiple configs
    const updatePromises = [];

    if (Array.isArray(updates)) {
      // Multiple updates
      for (const update of updates) {
        if (!update.configKey || update.configValue === undefined) {
          continue; // Skip invalid entries
        }

        updatePromises.push(
          db.insert(userConfig)
            .values({
              configKey: update.configKey,
              configValue: update.configValue,
            })
            .onConflictDoUpdate({
              target: userConfig.configKey,
              set: {
                configValue: update.configValue,
                updatedAt: new Date(),
              },
            })
        );
      }
    } else {
      // Single update
      if (!updates.configKey || updates.configValue === undefined) {
        return NextResponse.json(
          { success: false, error: 'configKey and configValue are required' },
          { status: 400 }
        );
      }

      updatePromises.push(
        db.insert(userConfig)
          .values({
            configKey: updates.configKey,
            configValue: updates.configValue,
          })
          .onConflictDoUpdate({
            target: userConfig.configKey,
            set: {
              configValue: updates.configValue,
              updatedAt: new Date(),
            },
          })
      );
    }

    // Execute all updates
    await Promise.all(updatePromises);

    // Fetch updated configs
    const updatedConfigs = await db.select().from(userConfig);

    return NextResponse.json({
      success: true,
      data: updatedConfigs,
      message: `Updated ${updatePromises.length} config entries`
    });

  } catch (error) {
    console.error('Failed to update user config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update config' },
      { status: 500 }
    );
  }
}