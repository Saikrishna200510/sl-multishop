import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/sl_multishop?schema=public',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'sl_multishop_super_secret_access_jwt_key_production_grade_32_chars_min',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'sl_multishop_super_secret_refresh_jwt_key_production_grade_32_chars_min',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),

  superAdmin: {
    email: process.env.SUPERADMIN_EMAIL || 'admin@slit-solutions.com',
    password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026!SL'
  },

  enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10)
  }
};
