import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  geminiApiKey: string;
  geminiModel: string;
  aiConfidenceThreshold: number;
  highValueClaimThreshold: number;
  uploadDir: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/claimpilot',
  jwtSecret: process.env.JWT_SECRET || 'claimpilot_dev_fallback_secret_key_987654321',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  aiConfidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.80'),
  highValueClaimThreshold: parseFloat(process.env.HIGH_VALUE_CLAIM_THRESHOLD || '500000'),
  uploadDir: path.resolve(__dirname, '../../uploads'),
};

export const hasGeminiKey = (): boolean => {
  return Boolean(config.geminiApiKey && config.geminiApiKey.trim().length > 0 && config.geminiApiKey !== 'your_gemini_api_key_here');
};
