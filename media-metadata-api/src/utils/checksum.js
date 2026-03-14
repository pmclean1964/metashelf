// src/utils/checksum.js
'use strict';

const crypto = require('crypto');
const fs = require('fs');

/**
 * Compute MD5 checksum of a file, returned as "md5:<hex>".
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function computeChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(`md5:${hash.digest('hex')}`));
  });
}

module.exports = { computeChecksum };
