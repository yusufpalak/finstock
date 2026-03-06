import { TransactionRepository } from './transaction.repository.js';
import { getPool } from '../../config/database.js';
import { getExchangeRate } from '../../shared/currency.service.js';

const repo = new TransactionRepository();

export class TransactionService {
  async list(tenantId, filters) {
    return repo.findWithFilters(tenantId, filters);
  }

  async getById(tenantId, id) {
    return repo.findByIdOrFail(tenantId, id);
  }

  async create(tenantId, userId, tenantCurrency, data) {
    const { currency, amount, transaction_date, ...rest } = data;
    const rate = await getExchangeRate(currency, tenantCurrency, transaction_date);
    const amount_base = parseFloat((amount * rate).toFixed(4));

    const transaction = await repo.create(tenantId, {
      ...rest,
      amount,
      currency,
      amount_base,
      exchange_rate: rate,
      transaction_date,
      user_id: userId,
    });

    // Update stock if product linked
    if (data.product_id && data.type === 'expense') {
      const pool = getPool();
      await pool.query(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND tenant_id = ?`,
        [data.quantity || 0, data.product_id, tenantId]
      );
    }

    return transaction;
  }

  async update(tenantId, id, tenantCurrency, data) {
    const existing = await repo.findByIdOrFail(tenantId, id);
    const currency = data.currency || existing.currency;
    const amount = data.amount || existing.amount;
    const date = data.transaction_date || existing.transaction_date;

    const rate = await getExchangeRate(currency, tenantCurrency, date);
    const amount_base = parseFloat((amount * rate).toFixed(4));

    return repo.update(tenantId, id, { ...data, amount_base, exchange_rate: rate });
  }

  async delete(tenantId, id) {
    await repo.findByIdOrFail(tenantId, id);
    return repo.delete(tenantId, id);
  }

  async getCashflowData(tenantId, { period = 'daily', startDate, endDate, year }) {
    if (period === 'monthly') {
      return repo.getMonthlySummary(tenantId, year || new Date().getFullYear());
    }
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    return repo.getDailySummary(tenantId, start, end);
  }

  async getProfitability(tenantId, { startDate, endDate }) {
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    const summary = await repo.getProfitability(tenantId, start, end);
    return summary;
  }

  async getCategoryBreakdown(tenantId, type, { startDate, endDate }) {
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    return repo.getCategoryBreakdown(tenantId, type || 'income', start, end);
  }
}
