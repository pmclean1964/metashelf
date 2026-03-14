// src/utils/serialise.js
'use strict';

/**
 * Convert a Prisma Media record to a plain JSON-safe object.
 * Primarily converts BigInt sizeBytes -> Number.
 */
function serialiseMedia(record) {
  if (!record) return null;
  return {
    ...record,
    sizeBytes: record.sizeBytes !== undefined && record.sizeBytes !== null
      ? Number(record.sizeBytes)
      : record.sizeBytes,
  };
}

function serialiseMediaList(records) {
  return records.map(serialiseMedia);
}

module.exports = { serialiseMedia, serialiseMediaList };
