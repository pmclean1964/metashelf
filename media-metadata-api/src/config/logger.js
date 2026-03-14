// src/config/logger.js
'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('./index');

const logger = createLogger({
  level: config.logging.level,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    config.env === 'development'
      ? format.combine(format.colorize(), format.printf(({ timestamp, level, message, ...meta }) => {
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${extra}`;
        }))
      : format.json()
  ),
  transports: [new transports.Console()],
  silent: config.env === 'test',
});

module.exports = logger;
