import { getPool } from '../config/database.js';

export async function getExchangeRate(from, to, date) {
    if (from === to) return 1;
    const pool = getPool();

    // 1. Try exact or earlier date
    const [[row]] = await pool.query(
        `SELECT rate FROM exchange_rates 
     WHERE from_currency = ? AND to_currency = ? AND rate_date <= ? 
     ORDER BY rate_date DESC LIMIT 1`,
        [from, to, date]
    );
    if (row) return row.rate;

    // 2. Try inverse
    const [[invRow]] = await pool.query(
        `SELECT rate FROM exchange_rates 
     WHERE from_currency = ? AND to_currency = ? AND rate_date <= ? 
     ORDER BY rate_date DESC LIMIT 1`,
        [to, from, date]
    );
    if (invRow) return 1 / invRow.rate;

    // 3. Fallback: use the most recent available rate (any date)
    const [[latestRow]] = await pool.query(
        `SELECT rate FROM exchange_rates 
     WHERE from_currency = ? AND to_currency = ? 
     ORDER BY rate_date DESC LIMIT 1`,
        [from, to]
    );
    if (latestRow) return latestRow.rate;

    const [[latestInvRow]] = await pool.query(
        `SELECT rate FROM exchange_rates 
     WHERE from_currency = ? AND to_currency = ? 
     ORDER BY rate_date DESC LIMIT 1`,
        [to, from]
    );
    return latestInvRow ? 1 / latestInvRow.rate : 1;
}
