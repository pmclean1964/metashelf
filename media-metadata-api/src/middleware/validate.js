// src/middleware/validate.js
'use strict';

const { ValidationError } = require('../utils/errors');

/**
 * Returns an Express middleware that validates req[source] against a Joi schema.
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} source
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: false,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }

    req[source] = value;
    next();
  };
}

module.exports = { validate };
