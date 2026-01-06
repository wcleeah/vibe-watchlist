import { db } from '@/lib/db';
import { platformConfigs } from '@/lib/db/schema';

const presetPlatforms = [
  {
    platformId: 'youtube',
    name: 'youtube',
    displayName: 'YouTube',
    patterns: ['youtube.com', 'youtu.be'],
    extractor: 'official',
    color: '#ff0000',
    icon: 'Youtube',
    enabled: true,
    isPreset: true,
    addedBy: 'system',
    confidenceScore: '1.0',
    metadata: {
      description: 'Official YouTube API integration with oEmbed',
      supportedFormats: ['video', 'playlist', 'channel'],
    },
  },
  {
    platformId: 'twitch',
    name: 'twitch',
    displayName: 'Twitch',
    patterns: ['twitch.tv'],
    extractor: 'official',
    color: '#9146ff',
    icon: 'Twitch',
    enabled: true,
    isPreset: true,
    addedBy: 'system',
    confidenceScore: '1.0',
    metadata: {
      description: 'Official Twitch Helix API integration',
      supportedFormats: ['video', 'clip', 'stream'],
    },
  },
  {
    platformId: 'netflix',
    name: 'netflix',
    displayName: 'Netflix',
    patterns: ['netflix.com'],
    extractor: 'fallback',
    color: '#e50914',
    icon: 'Film',
    enabled: true,
    isPreset: true,
    addedBy: 'system',
    confidenceScore: '0.8',
    metadata: {
      description: 'Meta tag extraction with Google search fallback',
      supportedFormats: ['movie', 'series'],
    },
  },
  {
    platformId: 'nebula',
    name: 'nebula',
    displayName: 'Nebula',
    patterns: ['nebula.tv', 'watchnebula.com'],
    extractor: 'fallback',
    color: '#ffffff',
    icon: 'Star',
    enabled: true,
    isPreset: true,
    addedBy: 'system',
    confidenceScore: '0.8',
    metadata: {
      description: 'Meta tag extraction with Google search fallback',
      supportedFormats: ['video', 'channel'],
    },
  },
];

async function seedPlatforms() {
  try {
    console.log('Seeding preset platforms...');

    // Check if platforms already exist
    const existingPlatforms = await db.select().from(platformConfigs);
    if (existingPlatforms.length > 0) {
      console.log('Platforms already seeded, skipping...');
      return;
    }

    // Insert preset platforms
    await db.insert(platformConfigs).values(presetPlatforms);

    console.log(`Successfully seeded ${presetPlatforms.length} preset platforms`);
  } catch (error) {
    console.error('Error seeding platforms:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedPlatforms()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedPlatforms };