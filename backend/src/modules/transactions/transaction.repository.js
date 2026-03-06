// ── transaction.repository.js ─────────────────────────────────────────────
import { BaseRepository } from '../../shared/base.repository.js';

export class TransactionRepository extends BaseRepository {
  constructor() { super('transactions'); }

  async findWithFilters(tenantId, { startDate, endDate, type, category, limit = 50, offset = 0 }) {
    const conds = ['t.tenant_id = ?'];
    const vals = [tenantId];

    if (startDate) { conds.push('t.transaction_date >= ?'); vals.push(startDate); }
    if (endDate) { conds.push('t.transaction_date <= ?'); vals.push(endDate); }
    if (type) { conds.push('t.type = ?'); vals.push(type); }
    if (category) { conds.push('t.category = ?'); vals.push(category); }

    const sql = `SELECT t.*, p.name as product_name, u.name as user_name 
                 FROM transactions t 
                 LEFT JOIN products p ON t.product_id = p.id AND p.tenant_id = t.tenant_id
                 LEFT JOIN users u ON t.user_id = u.id
                 WHERE ${conds.join(' AND ')} 
                 ORDER BY transaction_date DESC, t.id DESC 
                 LIMIT ? OFFSET ?`;
    vals.push(limit, offset);
    return this.query(sql, vals);
  }

  async getDailySummary(tenantId, startDate, endDate) {
    return this.query(
      `SELECT transaction_date, type, SUM(amount_base) as total, currency, COUNT(*) as count
       FROM transactions WHERE tenant_id = ? AND transaction_date BETWEEN ? AND ?
       GROUP BY transaction_date, type ORDER BY transaction_date ASC`,
      [tenantId, startDate, endDate]
    );
  }

  async getMonthlySummary(tenantId, year) {
    return this.query(
      `SELECT MONTH(transaction_date) as month, type, SUM(amount_base) as total
       FROM transactions WHERE tenant_id = ? AND YEAR(transaction_date) = ?
       GROUP BY MONTH(transaction_date), type ORDER BY month ASC`,
      [tenantId, year]
    );
  }

  async getProfitability(tenantId, startDate, endDate) {
    const [rows] = await this.pool.query(
      `SELECT 
        SUM(CASE WHEN type='income' THEN amount_base ELSE 0 END) as total_income,
        SUM(CASE WHEN type='expense' THEN amount_base ELSE 0 END) as total_expense,
        SUM(CASE WHEN type='income' THEN amount_base ELSE -amount_base END) as net_profit
       FROM transactions WHERE tenant_id = ? AND transaction_date BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );
    return rows[0];
  }

  async getCategoryBreakdown(tenantId, type, startDate, endDate) {
    return this.query(
      `SELECT category, SUM(amount_base) as total, COUNT(*) as count
       FROM transactions WHERE tenant_id = ? AND type = ? AND transaction_date BETWEEN ? AND ?
       GROUP BY category ORDER BY total DESC`,
      [tenantId, type, startDate, endDate]
    );
  }
}
