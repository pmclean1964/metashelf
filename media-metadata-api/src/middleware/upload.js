// src/middleware/upload.js
'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { ValidationError } = require('../utils/errors');

// Ensure upload directory exists at startup
fs.mkdirSync(config.storage.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, config.storage.uploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const { allowedMimeTypes } = config.storage;
  if (!allowedMimeTypes || allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(
    new ValidationError(
      `MIME type '${file.mimetype}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
    )
  );
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.storage.maxFileSizeBytes },
});

module.exports = { upload };
