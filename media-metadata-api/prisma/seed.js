// prisma/seed.js
// Optional seed for development — creates a few placeholder records.
// Run: node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.media.createMany({
    data: [
      {
        title: 'Sample Podcast Episode',
        description: 'A demo audio file entry',
        tags: ['podcast', 'demo'],
        mediaType: 'AUDIO',
        mimeType: 'audio/mpeg',
        originalFilename: 'episode-01.mp3',
        storedFilename: 'seed-audio-001.mp3',
        storagePath: 'uploads/seed-audio-001.mp3',
        sizeBytes: BigInt(4096000),
        checksum: 'abc123def456',
        durationSeconds: 180.5,
        createdBy: 'seed-script',
        metadata: { station: 'WDEMO', episode: 1, season: 1 },
      },
      {
        title: 'Sample Banner Image',
        description: 'A demo image entry',
        tags: ['banner', 'marketing'],
        mediaType: 'IMAGE',
        mimeType: 'image/jpeg',
        originalFilename: 'banner.jpg',
        storedFilename: 'seed-image-001.jpg',
        storagePath: 'uploads/seed-image-001.jpg',
        sizeBytes: BigInt(512000),
        checksum: 'xyz789uvw012',
        width: 1920,
        height: 1080,
        createdBy: 'seed-script',
        metadata: { campaign: 'spring-2024', approved: true },
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
