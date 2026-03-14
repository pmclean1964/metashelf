// src/controllers/health.controller.js
'use strict';

const prisma = require('../config/prisma');

async function health(req, res) {
  // Probe the database
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  const code = status === 'ok' ? 200 : 503;

  return res.status(code).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: { database: dbStatus },
  });
}

module.exports = { health };
