// src/controllers/media.controller.js
'use strict';

const service = require('../services/media.service');
const { ValidationError } = require('../utils/errors');
const fs = require('fs');

// ── POST /api/media ───────────────────────────────────────────────────────────
async function upload(req, res) {
  if (!req.file) {
    throw new ValidationError('A file must be attached under the field name "file"');
  }
  const media = await service.createMedia(req.file, req.body);
  return res.status(201).json(media);
}

// ── GET /api/media ────────────────────────────────────────────────────────────
async function list(req, res) {
  const result = await service.listMedia(req.query);
  return res.json(result);
}

// ── GET /api/media/:id ────────────────────────────────────────────────────────
async function getById(req, res) {
  const media = await service.getMediaById(req.params.id);
  return res.json(media);
}

// ── GET /api/media/:id/file ───────────────────────────────────────────────────
async function streamFile(req, res) {
  const { absolutePath, record } = await service.getMediaFilePath(req.params.id);

  const stat = fs.statSync(absolutePath);
  const fileSize = stat.size;
  const rangeHeader = req.headers.range;

  res.setHeader('Content-Type', record.mimeType);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodeURIComponent(record.originalFilename)}"`
  );

  // ── Range request (partial content for audio/video players) ────────────────
  if (rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunkSize);

    const stream = fs.createReadStream(absolutePath, { start, end });
    return stream.pipe(res);
  }

  // ── Full file ──────────────────────────────────────────────────────────────
  res.setHeader('Content-Length', fileSize);
  res.setHeader('Accept-Ranges', 'bytes');
  const stream = fs.createReadStream(absolutePath);
  return stream.pipe(res);
}

// ── PATCH /api/media/:id ──────────────────────────────────────────────────────
async function update(req, res) {
  const media = await service.updateMedia(req.params.id, req.body);
  return res.json(media);
}

// ── DELETE /api/media/:id ─────────────────────────────────────────────────────
async function remove(req, res) {
  const result = await service.deleteMedia(req.params.id);
  return res.json(result);
}

module.exports = { upload, list, getById, streamFile, update, remove };
