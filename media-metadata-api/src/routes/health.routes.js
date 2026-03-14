// src/routes/health.routes.js
'use strict';

const express = require('express');
const router = express.Router();
const { health } = require('../controllers/health.controller');

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Returns the operational status of the API and its dependencies.
 *     responses:
 *       200:
 *         description: All systems healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 timestamp: { type: string, format: date-time }
 *                 uptime: { type: integer, description: "Server uptime in seconds" }
 *                 services:
 *                   type: object
 *                   properties:
 *                     database: { type: string, example: ok }
 *       503:
 *         description: One or more dependencies are unavailable
 */
router.get('/', health);

module.exports = router;
