// tests/unit/validators.test.js
'use strict';

const {
  uploadBodySchema,
  updateBodySchema,
  listQuerySchema,
} = require('../../src/validators/media.validators');

describe('uploadBodySchema', () => {
  it('passes with only required fields', () => {
    const { error } = uploadBodySchema.validate({ title: 'My Title' });
    expect(error).toBeUndefined();
  });

  it('fails when title is missing', () => {
    const { error } = uploadBodySchema.validate({});
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('title');
  });

  it('accepts tags as a comma-separated string', () => {
    const { value, error } = uploadBodySchema.validate({ title: 'T', tags: 'a,b,c' });
    expect(error).toBeUndefined();
  });

  it('accepts metadata as a JSON string', () => {
    const { error } = uploadBodySchema.validate({
      title: 'T',
      metadata: '{"station":"WXYZ"}',
    });
    expect(error).toBeUndefined();
  });
});

describe('updateBodySchema', () => {
  it('fails on empty body', () => {
    const { error } = updateBodySchema.validate({});
    expect(error).toBeDefined();
  });

  it('passes with partial fields', () => {
    const { error } = updateBodySchema.validate({ title: 'New Title' });
    expect(error).toBeUndefined();
  });
});

describe('listQuerySchema', () => {
  it('applies defaults', () => {
    const { value } = listQuerySchema.validate({});
    expect(value.page).toBe(1);
    expect(value.pageSize).toBe(20);
    expect(value.sortBy).toBe('createdAt');
    expect(value.sortOrder).toBe('desc');
  });

  it('allows metadata.* keys through', () => {
    const { error } = listQuerySchema.validate({ 'metadata.station': 'WXYZ' });
    expect(error).toBeUndefined();
  });

  it('rejects pageSize > 100', () => {
    const { error } = listQuerySchema.validate({ pageSize: 999 });
    expect(error).toBeDefined();
  });
});
