/**
 * Error Handler Middleware
 */

import { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Error:', err);

  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'An internal error occurred',
      
    }
  }, 500);
};
