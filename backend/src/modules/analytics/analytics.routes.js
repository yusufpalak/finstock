import { authenticate } from '../../middleware/auth.js';
import { getPool } from '../../config/database.js';

export async function analyticsRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/dashboard', async (req) => {
    const pool = getPool();
    const tenantId = req.tenantId;
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const [[todayStats]] = await pool.query(
      `SELECT
        SUM(CASE WHEN type='income' THEN amount_base ELSE 0 END) as today_income,
        SUM(CASE WHEN type='expense' THEN amount_base ELSE 0 END) as today_expense
       FROM transactions WHERE tenant_id = ? AND transaction_date = ?`,
      [tenantId, today]
    );

    const [[monthStats]] = await pool.query(
      `SELECT
        SUM(CASE WHEN type='income' THEN amount_base ELSE 0 END) as month_income,
        SUM(CASE WHEN type='expense' THEN amount_base ELSE 0 END) as month_expense
       FROM transactions WHERE tenant_id = ? AND transaction_date >= ?`,
      [tenantId, monthStart]
    );

    const [[stockStats]] = await pool.query(
      `SELECT COUNT(*) as alert_count FROM products 
       WHERE tenant_id = ? AND is_active = 1 AND stock_quantity <= stock_alert_threshold`,
      [tenantId]
    );

    const [[receivableStats]] = await pool.query(
      `SELECT 
        SUM(amount_base - COALESCE(paid_amount, 0)) as total_outstanding,
        COUNT(CASE WHEN due_date < CURDATE() THEN 1 END) as overdue_count
       FROM receivables WHERE tenant_id = ? AND status IN ('pending','partial','overdue')`,
      [tenantId]
    );

    return {
      success: true,
      data: {
        today: todayStats,
        month: monthStats,
        stock: stockStats,
        receivables: receivableStats,
        currency: req.tenantCurrency,
      }
    };
  });
}
