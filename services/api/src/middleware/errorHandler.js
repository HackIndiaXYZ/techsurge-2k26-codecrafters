/**
 * @fileoverview Centralized error handler middleware.
 * Must be registered as the last middleware in Express.
 */

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Redact any unexpected stack trace details from the client response
  res.status(status).json({
    error: {
      status,
      message,
    },
  });
}
