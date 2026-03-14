// tests/helpers/testDb.js
'use strict';

const { PrismaClient } = require('@prisma/client');

// Use a separate test DB URL if provided, falling back to the default
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL },
  },
  log: [],
});

async function cleanDatabase() {
  await prisma.media.deleteMany({});
}

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = { prisma, cleanDatabase, disconnect };
