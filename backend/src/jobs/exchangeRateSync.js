import { getPool } from '../config/database.js';
import { config } from '../config/env.js';

// TCMB (Turkish Central Bank) free XML feed
async function fetchTCMBRates() {
  try {
    const res = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');
    const xml = await res.text();
    const rates = [];
    const today = new Date().toISOString().slice(0, 10);

    const matches = xml.matchAll(/<Currency[^>]*CurrencyCode="([^"]+)"[^>]*>[\s\S]*?<ForexSelling>([^<]+)<\/ForexSelling>/g);
    for (const [, code, rate] of matches) {
      const r = parseFloat(rate);
      if (r > 0) {
        // Rate is TRY per 1 foreign unit
        rates.push({ from: code, to: 'TRY', rate: r, date: today, source: 'TCMB' });
        rates.push({ from: 'TRY', to: code, rate: 1 / r, date: today, source: 'TCMB' });
      }
    }
    return rates;
  } catch (err) {
    console.error('TCMB fetch failed:', err.message);
    return [];
  }
}

export async function syncExchangeRates() {
  console.log('🔄 Syncing exchange rates...');
  const pool = getPool();

  let rates = [];
  if (config.exchangeRate.provider === 'tcmb') {
    rates = await fetchTCMBRates();
  }
  // Add fixer.io support here when needed

  if (rates.length === 0) {
    console.warn('No exchange rates fetched');
    return;
  }

  for (const r of rates) {
    await pool.query(
      `INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date, source) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rate = VALUES(rate)`,
      [r.from, r.to, r.rate, r.date, r.source]
    );
  }

  console.log(`✅ Synced ${rates.length} exchange rates`);
}
