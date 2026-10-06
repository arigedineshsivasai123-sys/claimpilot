import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        );
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: [(error as Error).message],
      });
    }
  };
};
