// src/middleware/errorHandler.js
'use strict';

const logger = require('../config/logger');
const { AppError } = require('../utils/errors');

/**
 * Central Express error handler.
 * Must be registered LAST — after all routes.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Known operational errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, path: req.path });
    } else {
      logger.warn(`${req.method} ${req.path} -> ${err.statusCode}: ${err.message}`, {
        ...(err.details ? { details: err.details } : {}),
        body: req.body,
      });
    }
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected field in upload' });
  }

  // Prisma unique-constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Generic / unexpected
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
