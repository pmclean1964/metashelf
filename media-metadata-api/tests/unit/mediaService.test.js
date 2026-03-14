// tests/unit/mediaService.test.js
'use strict';

// Mock all external I/O so unit tests run without DB or disk
jest.mock('../../src/repositories/media.repository');
jest.mock('../../src/utils/checksum');
jest.mock('fs');

const repo = require('../../src/repositories/media.repository');
const { computeChecksum } = require('../../src/utils/checksum');
const fs = require('fs');
const service = require('../../src/services/media.service');
const { NotFoundError } = require('../../src/utils/errors');

const FAKE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

const fakeRecord = {
  id: FAKE_ID,
  title: 'Unit Test Audio',
  description: null,
  tags: [],
  mediaType: 'AUDIO',
  mimeType: 'audio/mpeg',
  originalFilename: 'unit.mp3',
  storedFilename: 'unit-stored.mp3',
  storagePath: 'uploads/unit-stored.mp3',
  sizeBytes: BigInt(2048),
  checksum: 'md5:unit123',
  durationSeconds: 60,
  width: null,
  height: null,
  createdBy: 'jest',
  metadata: { station: 'WUNIT' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createMedia()', () => {
  it('computes checksum and creates a record', async () => {
    computeChecksum.mockResolvedValue('md5:deadbeef');
    repo.create.mockResolvedValue(fakeRecord);

    const file = {
      path: '/tmp/uploads/abc.mp3',
      filename: 'abc.mp3',
      originalname: 'myfile.mp3',
      mimetype: 'audio/mpeg',
      size: 2048,
    };

    const result = await service.createMedia(file, { title: 'Unit Test Audio' });

    expect(computeChecksum).toHaveBeenCalledWith(file.path);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ checksum: 'md5:deadbeef', title: 'Unit Test Audio' })
    );
    expect(result.id).toBe(FAKE_ID);
    expect(typeof result.sizeBytes).toBe('number'); // BigInt converted
  });
});

describe('getMediaById()', () => {
  it('returns serialised record when found', async () => {
    repo.findById.mockResolvedValue(fakeRecord);
    const result = await service.getMediaById(FAKE_ID);
    expect(result.id).toBe(FAKE_ID);
    expect(typeof result.sizeBytes).toBe('number');
  });

  it('throws NotFoundError when record is missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getMediaById(FAKE_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('updateMedia()', () => {
  it('merges metadata on update', async () => {
    repo.findById.mockResolvedValue(fakeRecord);
    repo.update.mockResolvedValue({
      ...fakeRecord,
      metadata: { station: 'WUNIT', episode: 5 },
    });

    const result = await service.updateMedia(FAKE_ID, { metadata: { episode: 5 } });
    expect(repo.update).toHaveBeenCalledWith(
      FAKE_ID,
      expect.objectContaining({ metadata: { station: 'WUNIT', episode: 5 } })
    );
    expect(result.metadata.station).toBe('WUNIT');
  });

  it('throws NotFoundError when record is missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.updateMedia(FAKE_ID, { title: 'X' })).rejects.toThrow(NotFoundError);
  });
});

describe('deleteMedia()', () => {
  it('deletes file on disk and DB record', async () => {
    repo.findById.mockResolvedValue(fakeRecord);
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});
    repo.remove.mockResolvedValue(fakeRecord);

    const result = await service.deleteMedia(FAKE_ID);
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(repo.remove).toHaveBeenCalledWith(FAKE_ID);
    expect(result.deleted).toBe(true);
  });

  it('still deletes DB record when file is missing from disk', async () => {
    repo.findById.mockResolvedValue(fakeRecord);
    fs.existsSync.mockReturnValue(false);
    repo.remove.mockResolvedValue(fakeRecord);

    const result = await service.deleteMedia(FAKE_ID);
    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(result.deleted).toBe(true);
  });
});
