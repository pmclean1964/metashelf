// tests/media.test.js
'use strict';

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { createApp } = require('../src/app');
const { cleanDatabase, disconnect } = require('./helpers/testDb');
const { createMediaRecord } = require('./helpers/fixtures');

// Point uploads to a temp dir during tests so we don't pollute the real one
const testUploadDir = path.join(os.tmpdir(), 'media-api-tests');
fs.mkdirSync(testUploadDir, { recursive: true });
process.env.UPLOAD_DIR = testUploadDir;

const app = createApp();

// Create a tiny test file we can upload
const testFilePath = path.join(testUploadDir, 'test-upload.mp3');
if (!fs.existsSync(testFilePath)) {
  fs.writeFileSync(testFilePath, Buffer.alloc(1024, 0)); // 1 KB of zeros
}

beforeEach(() => cleanDatabase());
afterAll(async () => {
  await cleanDatabase();
  await disconnect();
  // Clean up test files
  try {
    fs.readdirSync(testUploadDir).forEach((f) =>
      fs.unlinkSync(path.join(testUploadDir, f))
    );
  } catch { /* ignore */ }
});

// ── Upload ────────────────────────────────────────────────────────────────────
describe('POST /api/media', () => {
  it('uploads a file and returns 201 with the media record', async () => {
    const res = await request(app)
      .post('/api/media')
      .field('title', 'My Test File')
      .field('description', 'A test upload')
      .field('metadata', JSON.stringify({ station: 'WTEST', episode: 1 }))
      .attach('file', testFilePath);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('My Test File');
    expect(res.body.mediaType).toBe('AUDIO');
    expect(res.body.metadata.station).toBe('WTEST');
    expect(res.body.checksum).toMatch(/^md5:/);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/media')
      .attach('file', testFilePath);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/media')
      .send({ title: 'No file' });

    expect(res.status).toBe(400);
  });
});

// ── List ──────────────────────────────────────────────────────────────────────
describe('GET /api/media', () => {
  it('returns a paginated list', async () => {
    await createMediaRecord({ title: 'Alpha' });
    await createMediaRecord({ title: 'Beta' });

    const res = await request(app).get('/api/media');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.page).toBe(1);
  });

  it('filters by mediaType', async () => {
    await createMediaRecord({ mediaType: 'AUDIO' });
    await createMediaRecord({ mediaType: 'IMAGE', mimeType: 'image/jpeg' });

    const res = await request(app).get('/api/media?mediaType=AUDIO');
    expect(res.status).toBe(200);
    expect(res.body.data.every((m) => m.mediaType === 'AUDIO')).toBe(true);
  });

  it('searches by title', async () => {
    await createMediaRecord({ title: 'Unique Podcast Title' });
    await createMediaRecord({ title: 'Something Else' });

    const res = await request(app).get('/api/media?search=Unique+Podcast');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Unique Podcast Title');
  });

  it('filters by metadata field', async () => {
    await createMediaRecord({ metadata: { station: 'WXYZ' } });
    await createMediaRecord({ metadata: { station: 'WABC' } });

    const res = await request(app).get('/api/media?metadata.station=WXYZ');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].metadata.station).toBe('WXYZ');
  });

  it('respects pagination params', async () => {
    for (let i = 0; i < 5; i++) {
      await createMediaRecord({ title: `Record ${i}` });
    }

    const res = await request(app).get('/api/media?page=2&pageSize=2');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.totalPages).toBe(3);
  });

  it('returns 400 for invalid query params', async () => {
    const res = await request(app).get('/api/media?pageSize=999');
    expect(res.status).toBe(400);
  });
});

// ── Get by ID ─────────────────────────────────────────────────────────────────
describe('GET /api/media/:id', () => {
  it('returns the media record', async () => {
    const record = await createMediaRecord({ title: 'Find Me' });

    const res = await request(app).get(`/api/media/${record.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(record.id);
    expect(res.body.title).toBe('Find Me');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/media/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

// ── Stream file ───────────────────────────────────────────────────────────────
describe('GET /api/media/:id/file', () => {
  it('returns 404 when file is missing on disk', async () => {
    const record = await createMediaRecord({ storedFilename: 'nonexistent-file.mp3' });
    const res = await request(app).get(`/api/media/${record.id}/file`);
    expect(res.status).toBe(404);
  });
});

// ── Update ────────────────────────────────────────────────────────────────────
describe('PATCH /api/media/:id', () => {
  it('updates allowed fields', async () => {
    const record = await createMediaRecord({ title: 'Old Title' });

    const res = await request(app)
      .patch(`/api/media/${record.id}`)
      .send({ title: 'New Title', tags: ['updated'] });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');
    expect(res.body.tags).toContain('updated');
  });

  it('deep-merges metadata', async () => {
    const record = await createMediaRecord({ metadata: { station: 'WOLD', episode: 1 } });

    const res = await request(app)
      .patch(`/api/media/${record.id}`)
      .send({ metadata: { episode: 2, approved: true } });

    expect(res.status).toBe(200);
    expect(res.body.metadata.station).toBe('WOLD');   // preserved
    expect(res.body.metadata.episode).toBe(2);        // updated
    expect(res.body.metadata.approved).toBe(true);    // added
  });

  it('returns 400 when body is empty', async () => {
    const record = await createMediaRecord();
    const res = await request(app).patch(`/api/media/${record.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .patch('/api/media/00000000-0000-0000-0000-000000000000')
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });
});

// ── Delete ────────────────────────────────────────────────────────────────────
describe('DELETE /api/media/:id', () => {
  it('deletes the record and returns confirmation', async () => {
    const record = await createMediaRecord();

    const res = await request(app).delete(`/api/media/${record.id}`);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
    expect(res.body.id).toBe(record.id);

    // Confirm it is gone
    const check = await request(app).get(`/api/media/${record.id}`);
    expect(check.status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/media/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

// ── Swagger / OpenAPI ─────────────────────────────────────────────────────────
describe('GET /openapi.json', () => {
  it('returns a valid OpenAPI spec', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info.title).toBeDefined();
  });
});
