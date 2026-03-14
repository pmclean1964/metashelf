// tests/unit/utils.test.js
'use strict';

const { deriveMediaType } = require('../../src/utils/mediaType');
const { serialiseMedia } = require('../../src/utils/serialise');

describe('deriveMediaType()', () => {
  it.each([
    ['audio/mpeg', 'AUDIO'],
    ['audio/wav', 'AUDIO'],
    ['image/jpeg', 'IMAGE'],
    ['image/png', 'IMAGE'],
    ['video/mp4', 'VIDEO'],
    ['video/webm', 'VIDEO'],
    ['application/pdf', 'OTHER'],
    ['text/plain', 'OTHER'],
    [null, 'OTHER'],
    [undefined, 'OTHER'],
  ])('maps %s → %s', (mimeType, expected) => {
    expect(deriveMediaType(mimeType)).toBe(expected);
  });
});

describe('serialiseMedia()', () => {
  it('converts BigInt sizeBytes to number', () => {
    const record = { id: '1', sizeBytes: BigInt(4096000), title: 'Test' };
    const result = serialiseMedia(record);
    expect(typeof result.sizeBytes).toBe('number');
    expect(result.sizeBytes).toBe(4096000);
  });

  it('returns null for null input', () => {
    expect(serialiseMedia(null)).toBeNull();
  });
});
