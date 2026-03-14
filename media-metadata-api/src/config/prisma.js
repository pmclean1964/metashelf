// src/config/prisma.js
'use strict';

const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => logger.error('Prisma error', { message: e.message }));
prisma.$on('warn', (e) => logger.warn('Prisma warn', { message: e.message }));

module.exports = prisma;
