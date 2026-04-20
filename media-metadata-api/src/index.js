// src/index.js
'use strict';

const { createApp } = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const prisma = require('./config/prisma');

const app = createApp();

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    await prisma.$connect();
    logger.info('Database connection established');

    const server = app.listen(config.port, () => {
      logger.info(`media-metadata-api running`, {
        port: config.port,
        env: config.env,
        docs: `${config.apiUrl}/doc`,
      });
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────
    async function shutdown(signal) {
      logger.info(`Received ${signal}. Shutting down gracefully…`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server closed');
        process.exit(0);
      });
      // Force exit after 10 s
      setTimeout(() => process.exit(1), 10_000);
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

start();
