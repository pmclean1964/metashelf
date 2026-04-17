// src/repositories/media.repository.js
'use strict';

const prisma = require('../config/prisma');

/**
 * Parse query params of the form metadata.key=value into a Prisma
 * `path` filter clause for JSONB.
 *
 * @param {Record<string,string>} query  raw req.query
 * @returns {Array<object>}              array of Prisma `AND` conditions
 */
function buildMetadataFilters(query) {
  const conditions = [];
  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith('metadata.')) continue;
    const jsonKey = key.slice('metadata.'.length); // e.g. "family"

    // Boolean strings → exact equals on the JSON boolean value
    if (value === 'true') {
      conditions.push({ metadata: { path: [jsonKey], equals: true } });
      continue;
    }
    if (value === 'false') {
      conditions.push({ metadata: { path: [jsonKey], equals: false } });
      continue;
    }

    // Cast to number when possible so numeric comparisons work
    const parsed = Number(value);
    const isNumeric = !isNaN(parsed) && value !== '';

    if (isNumeric) {
      conditions.push({ metadata: { path: [jsonKey], equals: parsed } });
    } else {
      // String: use string_contains so that minor casing or encoding
      // differences don't cause a miss.
      conditions.push({ metadata: { path: [jsonKey], string_contains: value } });
    }
  }
  return conditions;
}

/**
 * Build a Prisma `where` clause from list/search query parameters.
 */
function buildWhereClause(query) {
  const {
    search,
    mediaType,
    tags,
    createdBy,
    mimeType,
    checksum,
    // Agent classification shorthands — mapped to metadata sub-keys below
    contentType,
    stationId,
    generatedBy,
    runId,
    ...rest
  } = query;

  const and = [];

  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalFilename: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  if (mediaType) and.push({ mediaType });
  if (createdBy) and.push({ createdBy });
  if (mimeType) and.push({ mimeType: { contains: mimeType, mode: 'insensitive' } });
  if (checksum) and.push({ checksum });

  // Agent shorthand filters: map to their metadata equivalents
  if (contentType) and.push({ metadata: { path: ['contentType'], string_contains: contentType } });
  if (stationId)   and.push({ metadata: { path: ['stationId'],   string_contains: stationId } });
  if (generatedBy) and.push({ metadata: { path: ['generatedBy'], string_contains: generatedBy } });
  if (runId)       and.push({ metadata: { path: ['runId'],       equals: runId } });

  if (tags) {
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagArray.length) {
      and.push({ tags: { hasSome: tagArray } });
    }
  }

  const metaConditions = buildMetadataFilters(rest);
  and.push(...metaConditions);

  return and.length ? { AND: and } : {};
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function create(data) {
  return prisma.media.create({ data });
}

async function findMany({ where, orderBy, skip, take }) {
  const [records, total] = await prisma.$transaction([
    prisma.media.findMany({ where, orderBy, skip, take }),
    prisma.media.count({ where }),
  ]);
  return { records, total };
}

async function findById(id) {
  return prisma.media.findUnique({ where: { id } });
}

async function findByStoredFilename(storedFilename) {
  return prisma.media.findUnique({ where: { storedFilename } });
}

async function update(id, data) {
  return prisma.media.update({ where: { id }, data });
}

async function remove(id) {
  return prisma.media.delete({ where: { id } });
}

module.exports = {
  buildWhereClause,
  create,
  findMany,
  findById,
  findByStoredFilename,
  update,
  remove,
};
