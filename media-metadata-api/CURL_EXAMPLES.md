# Sample curl Commands

All examples assume the API is running at `http://localhost:3000`.

---

## Upload a media file

```bash
curl -X POST http://localhost:3000/api/media \
  -F "file=@/path/to/episode.mp3" \
  -F "title=My Podcast Episode 42" \
  -F "description=An in-depth discussion about Node.js" \
  -F "tags=[\"podcast\",\"nodejs\",\"tech\"]" \
  -F "durationSeconds=3620.5" \
  -F "createdBy=producer-user-id" \
  -F 'metadata={"station":"WKRP","season":3,"episode":42,"approved":true}'
```

---

## List all media (default pagination)

```bash
curl http://localhost:3000/api/media
```

## List with pagination and sorting

```bash
curl "http://localhost:3000/api/media?page=2&pageSize=10&sortBy=sizeBytes&sortOrder=desc"
```

## Filter by media type

```bash
curl "http://localhost:3000/api/media?mediaType=AUDIO"
```

## Full-text search

```bash
curl "http://localhost:3000/api/media?search=podcast+nodejs"
```

## Filter by tags (matches any)

```bash
curl "http://localhost:3000/api/media?tags=podcast,tech"
```

## Filter by arbitrary metadata field

```bash
curl "http://localhost:3000/api/media?metadata.station=WKRP"
curl "http://localhost:3000/api/media?metadata.season=3&metadata.approved=true"
```

## Combined filters

```bash
curl "http://localhost:3000/api/media?mediaType=AUDIO&metadata.station=WKRP&page=1&pageSize=5"
```

---

## Get a single media record

```bash
curl http://localhost:3000/api/media/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Stream / download a file

```bash
# Stream to stdout
curl http://localhost:3000/api/media/a1b2c3d4-e5f6-7890-abcd-ef1234567890/file

# Download to disk
curl -o output.mp3 http://localhost:3000/api/media/a1b2c3d4-e5f6-7890-abcd-ef1234567890/file

# Range request (bytes 0–1023)
curl -H "Range: bytes=0-1023" \
  http://localhost:3000/api/media/a1b2c3d4-e5f6-7890-abcd-ef1234567890/file
```

---

## Update metadata (PATCH — merges metadata, does not replace)

```bash
curl -X PATCH http://localhost:3000/api/media/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Episode Title",
    "tags": ["podcast", "nodejs", "updated"],
    "metadata": { "episode": 43, "reviewed": true }
  }'
```

---

## Delete a media record (also removes file from disk)

```bash
curl -X DELETE http://localhost:3000/api/media/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Health check

```bash
curl http://localhost:3000/health
```

## OpenAPI spec (JSON)

```bash
curl http://localhost:3000/openapi.json | jq .
```
