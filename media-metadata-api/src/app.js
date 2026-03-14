// src/app.js
'use strict';

require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const mediaRoutes = require('./routes/media.routes');
const healthRoutes = require('./routes/health.routes');
const swaggerSpec = require('./config/swagger');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');

function createApp() {
  const app = express();

  // ── Security & utility middleware ──────────────────────────────────────────
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Request logging ────────────────────────────────────────────────────────
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: () => process.env.NODE_ENV === 'test',
    })
  );

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.use('/health', healthRoutes);
  app.use('/api/media', mediaRoutes);

  // ── OpenAPI / Swagger UI ───────────────────────────────────────────────────
  app.get('/openapi.json', (req, res) => res.json(swaggerSpec));
  app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

  // ── 404 handler ────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  });

  // ── Central error handler (must be last) ───────────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
