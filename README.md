# media-metadata-api

A production-minded Node.js/Express REST API for uploading, managing, and streaming media files (audio, images, video) with extensible JSONB metadata stored in PostgreSQL.

---

## Architecture

```
src/
├── config/         # Environment config, Prisma client, Winston logger, Swagger spec
├── routes/         # Express routers (JSDoc annotations for Swagger)
├── controllers/    # Thin HTTP layer — parse request, call service, return response
├── services/       # Business logic — checksum computation, metadata merge, file I/O
├── repositories/   # All Prisma/DB access; query building isolated here
├── middleware/     # Multer upload config, Joi validation wrapper, error handler
├── validators/     # Joi schemas for upload body, update body, list query
└── utils/          # Errors, checksum, mediaType derivation, BigInt serialisation
```

**Data flow:** `Route → Middleware (validate/multer) → Controller → Service → Repository → Prisma → PostgreSQL`

---

## Requirements

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

---

## Quick Start (local)

### 1. Install dependencies

```bash
cd media-metadata-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL
```

### 3. Start PostgreSQL

The easiest way is Docker:

```bash
docker-compose up db -d
```

Or point `DATABASE_URL` at an existing Postgres instance.

### 4. Run database migrations

```bash
npx prisma migrate deploy
# or, during development:
npx prisma migrate dev
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Start the server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

The API is now at `http://localhost:3000`.  
Swagger UI is at `http://localhost:3000/doc`.

---

## Quick Start (Docker Compose)

Starts both PostgreSQL and the API, runs migrations automatically:

```bash
docker-compose up --build
```

---

## Running Tests

Tests require a running PostgreSQL instance (uses `TEST_DATABASE_URL` or falls back to `DATABASE_URL`).

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage
```

Tests are split into:
- `tests/health.test.js` — integration test for `/health`
- `tests/media.test.js` — full integration tests for all `/api/media` endpoints
- `tests/unit/` — fast unit tests (mocked DB/disk)

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/media` | Upload a media file |
| `GET` | `/api/media` | List / search media records |
| `GET` | `/api/media/:id` | Get a single record by UUID |
| `GET` | `/api/media/:id/file` | Stream / download the raw file |
| `PATCH` | `/api/media/:id` | Update metadata (deep-merges `metadata` JSONB) |
| `DELETE` | `/api/media/:id` | Delete record and file from disk |
| `GET` | `/health` | Health check |
| `GET` | `/doc` | Swagger UI |
| `GET` | `/openapi.json` | Raw OpenAPI 3.0 spec |

---

## Search & Filtering

`GET /api/media` accepts the following query parameters:

| Parameter | Description |
|-----------|-------------|
| `page` | Page number (default: 1) |
| `pageSize` | Results per page (default: 20, max: 100) |
| `search` | Full-text search on title, description, originalFilename |
| `mediaType` | `AUDIO` \| `IMAGE` \| `VIDEO` \| `OTHER` |
| `tags` | Comma-separated; matches records containing **any** of the tags |
| `mimeType` | Partial match on MIME type |
| `createdBy` | Exact match |
| `checksum` | Exact match |
| `sortBy` | `createdAt` \| `updatedAt` \| `title` \| `sizeBytes` |
| `sortOrder` | `asc` \| `desc` |
| `metadata.<key>` | Filter by arbitrary JSONB field (e.g. `metadata.station=WKRP`) |

---

## Data Model

```
Media
  id               UUID (PK)
  title            String
  description      String?
  tags             String[]
  mediaType        Enum (AUDIO | IMAGE | VIDEO | OTHER)
  mimeType         String
  originalFilename String
  storedFilename   String (unique — UUID-based filename on disk)
  storagePath      String (relative path from project root)
  sizeBytes        BigInt
  checksum         String  (format: "md5:<hex>")
  durationSeconds  Float?
  width            Int?
  height           Int?
  createdBy        String?
  metadata         Json    (JSONB with GIN index)
  createdAt        DateTime
  updatedAt        DateTime
```

---

## Environment Variables

See `.env.example` for all options.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `UPLOAD_DIR` | `./uploads` | Directory for stored files |
| `MAX_FILE_SIZE_BYTES` | `524288000` | 500 MB upload limit |
| `ALLOWED_MIME_TYPES` | *(all)* | Comma-separated allowed MIME types |
| `LOG_LEVEL` | `info` | Winston log level |

---

## Notable Design Decisions

- **JSONB metadata with GIN index** — enables efficient `?`, `@>`, and `path` queries.
- **Metadata PATCH merges** — `PATCH /api/media/:id` merges incoming `metadata` into the existing object rather than replacing it, preventing accidental data loss.
- **Range requests** — `GET /api/media/:id/file` honours the HTTP `Range` header so HTML `<audio>` and `<video>` elements can seek.
- **BigInt serialisation** — Prisma returns `sizeBytes` as `BigInt`; the serialise utility converts it to `Number` before sending JSON responses.
- **Clean shutdown** — SIGTERM/SIGINT close the HTTP server and disconnect Prisma before exit.
- **express-async-errors** — patches Express so `async` route handlers don't need manual `try/catch`; errors propagate to the central error handler automatically.
