// src/utils/errors.js
'use strict';

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', id) {
    super(id ? `${resource} with id '${id}' not found` : `${resource} not found`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

module.exports = { AppError, NotFoundError, ValidationError, ConflictError };
