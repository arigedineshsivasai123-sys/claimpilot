import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import claimRoutes from './routes/claim.routes';
import healthRoutes from './routes/health.routes';
import { errorHandler } from './middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: true, // Allow all origins for API calls, or specific client URL
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/claims', claimRoutes);

  // Fallback for 404 routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
