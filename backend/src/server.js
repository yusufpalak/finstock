import { buildApp } from './app.js';
import { config } from './config/env.js';
import { testConnection } from './config/database.js';
import cron from 'node-cron';

async function start() {
  try {
    await testConnection();
    console.log('✅ Database connected');

    const app = await buildApp();

    // Daily exchange rate sync at 02:00 UTC
    cron.schedule('0 2 * * *', async () => {
      const { syncExchangeRates } = await import('./jobs/exchangeRateSync.js');
      await syncExchangeRates();
    });

    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Server running on port ${config.port}`);
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
