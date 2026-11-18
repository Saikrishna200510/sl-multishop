import app from './app.js';
import { config } from './config/index.js';
import { prisma } from './services/prisma.js';

const PORT = config.port;

async function startServer() {
  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database successfully.');

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 SL MULTISHOP - MULTI-TENANT BILLING & POS SAAS`);
      console.log(`🏢 SL IT SOLUTIONS`);
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Process-level safety handlers to prevent server crashes
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('⚠️ Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('⚠️ Uncaught Exception in worker process:', err);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server and database pool');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server and database pool');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
