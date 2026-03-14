// tests/helpers/fixtures.js
'use strict';

const { prisma } = require('./testDb');

async function createMediaRecord(overrides = {}) {
  return prisma.media.create({
    data: {
      title: 'Test Audio',
      description: 'A test audio file',
      tags: ['test', 'audio'],
      mediaType: 'AUDIO',
      mimeType: 'audio/mpeg',
      originalFilename: 'test.mp3',
      storedFilename: `test-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`,
      storagePath: 'uploads/test.mp3',
      sizeBytes: BigInt(1024),
      checksum: 'md5:abc123',
      durationSeconds: 120,
      createdBy: 'test-user',
      metadata: { station: 'WTEST', episode: 1 },
      ...overrides,
    },
  });
}

module.exports = { createMediaRecord };
