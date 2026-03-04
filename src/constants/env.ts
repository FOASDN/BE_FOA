import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Environment variable ${key} is missing`);
  }

  return value;
};

//env
export const NODE_ENV = getEnv('NODE_ENV');
export const PORT = getEnv('PORT', '4004');

//app
export const APP_ORIGIN = getEnv('APP_ORIGIN');

//auth
export const AUTH_JWT_SECRET = getEnv('AUTH_JWT_SECRET');
export const AUTH_JWT_REFRESH_SECRET = getEnv('AUTH_JWT_REFRESH_SECRET');

//mongo_db
export const MONGODB_URI = getEnv('MONGODB_URI');

// node_mailer
export const GOOGLE_APP_USER = getEnv('GOOGLE_APP_USER');
export const GOOGLE_APP_PASSWORD = getEnv('GOOGLE_APP_PASSWORD');

// cloudinary
export const CLOUDINARY_CLOUD_NAME = getEnv('CLOUDINARY_CLOUD_NAME');
export const CLOUDINARY_API_KEY = getEnv('CLOUDINARY_API_KEY');
export const CLOUDINARY_API_SECRET = getEnv('CLOUDINARY_API_SECRET');

// gemini ai
export const GEMINI_API_KEY = getEnv('GEMINI_API_KEY');
