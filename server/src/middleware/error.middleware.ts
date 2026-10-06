import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { config } from '../config/env.config';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    });
    return;
  }

  if (err instanceof MulterError) {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large (maximum size is 15MB)';
    if (err.code === 'LIMIT_FILE_COUNT') message = 'Too many files uploaded (maximum is 10)';
    res.status(400).json({
      success: false,
      message,
      errors: [err.message],
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Resource not found or invalid identifier format',
      errors: [`Invalid ${err.path}: ${err.value}`],
    });
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: [message],
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
};
