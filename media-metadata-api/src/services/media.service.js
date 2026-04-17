// src/services/media.service.js
'use strict';

const fs = require('fs');
const path = require('path');
const repo = require('../repositories/media.repository');
const { computeChecksum } = require('../utils/checksum');
const { deriveMediaType } = require('../utils/mediaType');
const { serialiseMedia, serialiseMediaList } = require('../utils/serialise');
const { NotFoundError } = require('../utils/errors');
const config = require('../config');
const logger = require('../config/logger');

// ── Create ────────────────────────────────────────────────────────────────────

async function createMedia(file, body) {
  const checksum = await computeChecksum(file.path);

  // Parse tags (form-data may send a JSON string or a comma-separated string)
  let tags = [];
  if (body.tags) {
    if (Array.isArray(body.tags)) {
      tags = body.tags;
    } else {
      try {
        const parsed = JSON.parse(body.tags);
        tags = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        tags = body.tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }
  }

  // Parse metadata (form-data sends it as a JSON string)
  let metadata = {};
  if (body.metadata) {
    if (typeof body.metadata === 'object') {
      metadata = body.metadata;
    } else {
      try {
        metadata = JSON.parse(body.metadata);
      } catch {
        metadata = {};
      }
    }
  }

  // Fold agent classification fields into metadata so they are queryable
  // via metadata.contentType, metadata.stationId, etc.
  if (body.contentType) metadata.contentType = metadata.contentType ?? body.contentType;
  if (body.stationId)   metadata.stationId   = metadata.stationId   ?? body.stationId;
  if (body.generatedBy) metadata.generatedBy = metadata.generatedBy ?? body.generatedBy;
  if (body.runId)       metadata.runId       = metadata.runId       ?? body.runId;

  const storagePath = path.relative(process.cwd(), file.path);

  const record = await repo.create({
    title: body.title,
    description: body.description || null,
    tags,
    mediaType: deriveMediaType(file.mimetype),
    mimeType: file.mimetype,
    originalFilename: file.originalname,
    storedFilename: file.filename,
    storagePath,
    sizeBytes: BigInt(file.size),
    checksum,
    durationSeconds: body.durationSeconds ? Number(body.durationSeconds) : null,
    width: body.width ? Number(body.width) : null,
    height: body.height ? Number(body.height) : null,
    createdBy: body.createdBy || null,
    metadata,
  });

  return serialiseMedia(record);
}

// ── List / search ─────────────────────────────────────────────────────────────

async function listMedia(query) {
  const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc', ...rest } = query;

  const where = repo.buildWhereClause(rest);
  const skip = (page - 1) * pageSize;
  const orderBy = { [sortBy]: sortOrder };

  const { records, total } = await repo.findMany({ where, orderBy, skip, take: pageSize });

  return {
    data: serialiseMediaList(records),
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ── Get by ID ─────────────────────────────────────────────────────────────────

async function getMediaById(id) {
  const record = await repo.findById(id);
  if (!record) throw new NotFoundError('Media', id);
  return serialiseMedia(record);
}

// ── Get file path for streaming ───────────────────────────────────────────────

async function getMediaFilePath(id) {
  const record = await repo.findById(id);
  if (!record) throw new NotFoundError('Media', id);

  const absolutePath = path.join(config.storage.uploadDir, record.storedFilename);
  if (!fs.existsSync(absolutePath)) {
    throw new NotFoundError('File on disk for media', id);
  }

  return { absolutePath, record: serialiseMedia(record) };
}

// ── Update ────────────────────────────────────────────────────────────────────

async function updateMedia(id, body) {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Media', id);

  // Deep-merge metadata: existing + patch
  const mergedMetadata =
    body.metadata != null
      ? { ...(existing.metadata || {}), ...body.metadata }
      : undefined;

  const data = {
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.tags !== undefined && { tags: body.tags }),
    ...(body.durationSeconds !== undefined && { durationSeconds: body.durationSeconds }),
    ...(body.width !== undefined && { width: body.width }),
    ...(body.height !== undefined && { height: body.height }),
    ...(body.createdBy !== undefined && { createdBy: body.createdBy }),
    ...(mergedMetadata !== undefined && { metadata: mergedMetadata }),
  };

  const updated = await repo.update(id, data);
  return serialiseMedia(updated);
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deleteMedia(id) {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Media', id);

  // Remove file from disk (best-effort — don't fail the delete if file is missing)
  const absolutePath = path.join(config.storage.uploadDir, existing.storedFilename);
  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      logger.info(`Deleted file from disk: ${absolutePath}`);
    }
  } catch (err) {
    logger.warn(`Could not delete file from disk: ${absolutePath}`, { error: err.message });
  }

  await repo.remove(id);
  return { deleted: true, id };
}

// ── Delete all ────────────────────────────────────────────────────────────────

async function deleteAllMedia() {
  const { records } = await repo.findMany({ where: {}, orderBy: { createdAt: 'desc' }, skip: 0, take: 100000 });

  let deleted = 0;
  for (const record of records) {
    const absolutePath = path.join(config.storage.uploadDir, record.storedFilename);
    try {
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    } catch (err) {
      logger.warn(`Could not delete file: ${absolutePath}`, { error: err.message });
    }
    await repo.remove(record.id);
    deleted++;
  }

  logger.info(`deleteAllMedia: purged ${deleted} records`);
  return { deleted };
}

module.exports = {
  createMedia,
  listMedia,
  getMediaById,
  getMediaFilePath,
  updateMedia,
  deleteMedia,
  deleteAllMedia,
};
