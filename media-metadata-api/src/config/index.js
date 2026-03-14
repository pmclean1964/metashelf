// src/config/index.js
'use strict';

const path = require('path');

function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  db: {
    url: process.env.DATABASE_URL || 'postgresql://media_user:media_pass@localhost:5432/media_db',
  },

  storage: {
    uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || String(500 * 1024 * 1024), 10),
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES
      ? process.env.ALLOWED_MIME_TYPES.split(',').map((t) => t.trim())
      : null, // null = allow all
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
