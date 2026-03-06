import { getPool } from '../config/database.js';

export async function getExchangeRate(from, to, date) {
    if (from === to) return 1;
    const pool = getPool();
    // Get the rate for the specific date, or the latest one before it
    const [[row]] = await pool.query(
        `SELECT rate FROM exchange_rates 
     WHERE from_currency = ? AND to_currency = ? AND rate_date <= ? 
     ORDER BY rate_date DESC LIMIT 1`,
        [from, to, date]
    );

    if (row) return row.rate;

    // If not found, try the inverse
    const [[invRow]] = await pool.query(
        `SELECT rate FROM exchange_rates 
     WHERE from_currency = ? AND to_currency = ? AND rate_date <= ? 
     ORDER BY rate_date DESC LIMIT 1`,
        [to, from, date]
    );

    return invRow ? 1 / invRow.rate : 1;
}
