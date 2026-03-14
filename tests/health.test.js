// tests/health.test.js
'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { disconnect } = require('./helpers/testDb');

const app = createApp();

afterAll(() => disconnect());

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body.services.database).toBe('ok');
  });
});
