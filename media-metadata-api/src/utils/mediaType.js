// src/utils/mediaType.js
'use strict';

/**
 * Derive a Prisma MediaType enum value from a MIME type string.
 * @param {string} mimeType
 * @returns {'AUDIO'|'IMAGE'|'VIDEO'|'OTHER'}
 */
function deriveMediaType(mimeType) {
  if (!mimeType) return 'OTHER';
  const [type] = mimeType.toLowerCase().split('/');
  switch (type) {
    case 'audio': return 'AUDIO';
    case 'image': return 'IMAGE';
    case 'video': return 'VIDEO';
    default: return 'OTHER';
  }
}

module.exports = { deriveMediaType };
