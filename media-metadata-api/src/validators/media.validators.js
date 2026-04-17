// src/validators/media.validators.js
'use strict';

const Joi = require('joi');

// ── Upload (multipart fields only — file itself validated by multer) ──────────
const uploadBodySchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  tags: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().trim()),
      Joi.string().trim() // single tag as string
    )
    .optional(),
  durationSeconds: Joi.number().positive().optional().allow(null),
  width: Joi.number().integer().positive().optional().allow(null),
  height: Joi.number().integer().positive().optional().allow(null),
  createdBy: Joi.string().trim().max(255).optional().allow('', null),
  // Agent-supplied classification fields — folded into metadata on create
  contentType: Joi.string().trim().max(100).optional().allow('', null),
  stationId:   Joi.string().trim().max(100).optional().allow('', null),
  generatedBy: Joi.string().trim().max(100).optional().allow('', null),
  runId:       Joi.string().trim().max(100).optional().allow('', null),
  // metadata can be a JSON string (from form-data) or an object
  metadata: Joi.alternatives()
    .try(Joi.object(), Joi.string())
    .optional(),
});

// ── PATCH body ────────────────────────────────────────────────────────────────
const updateBodySchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).optional(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  durationSeconds: Joi.number().positive().optional().allow(null),
  width: Joi.number().integer().positive().optional().allow(null),
  height: Joi.number().integer().positive().optional().allow(null),
  createdBy: Joi.string().trim().max(255).optional().allow('', null),
  metadata: Joi.object().optional(),
}).min(1); // require at least one field

// ── List / search query params ────────────────────────────────────────────────
const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(255).optional(),
  mediaType: Joi.string().valid('AUDIO', 'IMAGE', 'VIDEO', 'OTHER').optional(),
  tags: Joi.string().optional(), // comma-separated
  createdBy: Joi.string().trim().optional(),
  mimeType: Joi.string().trim().optional(),
  checksum: Joi.string().trim().optional(),
  // Agent classification shorthands (map to metadata sub-keys in repository)
  contentType: Joi.string().trim().optional(),
  stationId:   Joi.string().trim().optional(),
  generatedBy: Joi.string().trim().optional(),
  runId:       Joi.string().trim().optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'title', 'sizeBytes')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
}).unknown(true); // allow metadata.* keys

module.exports = { uploadBodySchema, updateBodySchema, listQuerySchema };
