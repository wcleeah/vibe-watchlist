import { db } from './lib/db/index';
import { videos, tags, videoTags } from './lib/db/schema';

async function checkDatabase() {
  console.log('📊 Checking videos in database...');

  try {
    const allVideos = await db.select().from(videos);
    console.log('Found', allVideos.length, 'videos:');
    allVideos.forEach((video, i) => {
      console.log(`${i+1}. ID: ${video.id}, URL: ${video.url}`);
      console.log(`   Title: "${video.title}"`);
      console.log(`   Platform: ${video.platform}`);
      console.log(`   Thumbnail: ${video.thumbnailUrl}`);
      console.log('');
    });

    console.log('🏷️ Checking tags...');
    const allTags = await db.select().from(tags);
    console.log('Found', allTags.length, 'tags:');
    allTags.forEach((tag, i) => {
      console.log(`${i+1}. ${tag.name} (ID: ${tag.id})`);
    });

    console.log('\n🔗 Checking video-tag relationships...');
    const videoTagRelations = await db.select().from(videoTags);
    console.log('Found', videoTagRelations.length, 'relationships');
    videoTagRelations.forEach(rel => {
      console.log(`Video ${rel.videoId} ↔ Tag ${rel.tagId}`);
    });

  } catch (error) {
    console.error('Database error:', error);
  }
}

checkDatabase();