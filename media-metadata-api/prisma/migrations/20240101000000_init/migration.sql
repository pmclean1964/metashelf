-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('AUDIO', 'IMAGE', 'VIDEO', 'OTHER');

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediaType" "MediaType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksum" TEXT NOT NULL,
    "durationSeconds" DOUBLE PRECISION,
    "width" INTEGER,
    "height" INTEGER,
    "createdBy" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_storedFilename_key" ON "media"("storedFilename");
CREATE INDEX "media_mediaType_idx" ON "media"("mediaType");
CREATE INDEX "media_createdAt_idx" ON "media"("createdAt");
CREATE INDEX "media_checksum_idx" ON "media"("checksum");
-- GIN index for JSONB metadata searches
CREATE INDEX "media_metadata_gin_idx" ON "media" USING GIN ("metadata");
