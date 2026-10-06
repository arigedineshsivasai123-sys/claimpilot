import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './env.config';

// Configure Node's DNS resolver with reliable DNS servers (Google & Cloudflare)
// to resolve MongoDB SRV records without querySrv ETIMEOUT on Windows/ISP networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err: any) {
  console.warn(`[DNS Warning] Could not configure custom DNS servers: ${err.message}`);
}

let isConnected = false;

// Helper to mask credentials in MongoDB URIs for secure logging
export const maskMongoUri = (uri: string): string => {
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
};

// Register connection event listeners for status tracking
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log(`[Database Status] Connected - MongoDB host: ${mongoose.connection.host}`);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('[Database Status] Disconnected - MongoDB connection lost');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Status] Connection error: ${err.message}`);
});

export const connectDatabase = async (): Promise<boolean> => {
  if (isConnected) {
    return true;
  }

  try {
    // Ensure DNS servers are set before SRV resolution occurs
    dns.setServers(['8.8.8.8', '1.1.1.1']);

    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to host: ${conn.connection.host}`);
    console.log('[Database Status] Connected');
    return true;
  } catch (error: any) {
    isConnected = false;
    console.error(
      `[Database Warning] Could not connect to MongoDB (${maskMongoUri(config.mongodbUri)}): ${error.message}`
    );
    console.log(
      '[Database Status] Disconnected - Operating in resilient mode. Ensure MongoDB credentials and network access are verified.'
    );
    return false;
  }
};

export const getDbStatus = () => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    isConnected: mongoose.connection.readyState === 1,
  };
};
