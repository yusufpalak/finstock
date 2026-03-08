import { BaseRepository } from '../../shared/base.repository.js';
import { authenticate } from '../../middleware/auth.js';
import { getExchangeRate } from '../../shared/currency.service.js';

// ── Repository ────────────────────────────────────────────────────────────
class ReceivableRepository extends BaseRepository {
  constructor() { super('receivables'); }

  async getOverdue(tenantId) {
    return this.query(
      `SELECT * FROM receivables WHERE tenant_id = ? AND status IN ('pending','partial','overdue') AND due_date < CURDATE() ORDER BY due_date ASC`,
      [tenantId]
    );
  }

  async getSummary(tenantId) {
    const [rows] = await this.pool.query(
      `SELECT currency,
        SUM(CASE WHEN status IN ('pending','partial','overdue') THEN (amount - COALESCE(paid_amount, 0)) ELSE 0 END) as outstanding,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as collected,
        COUNT(CASE WHEN status IN ('pending','partial','overdue') AND due_date < CURDATE() THEN 1 END) as overdue_count
       FROM receivables WHERE tenant_id = ? GROUP BY currency`,
      [tenantId]
    );
    return rows;
  }

  async updateStatus(tenantId, id) {
    const rec = await this.findByIdOrFail(tenantId, id);
    if (rec.status !== 'paid') {
      const newStatus = rec.paid_at ? 'paid' : 'pending';
      await this.update(tenantId, id, { status: newStatus });
    }
  }
}

const repo = new ReceivableRepository();

// ── Service ───────────────────────────────────────────────────────────────
class ReceivableService {
  async list(tenantId, { status, limit = 50, offset = 0 } = {}) {
    return repo.findAll(tenantId, {
      where: status ? { status } : {},
      orderBy: 'due_date ASC',
      limit, offset
    });
  }

  async getById(tenantId, id) { return repo.findByIdOrFail(tenantId, id); }

  async create(tenantId, userId, tenantCurrency, data) {
    const now = new Date();
    const due = new Date(data.due_date);
    const status = due < now ? 'overdue' : 'pending';
    const rate = await getExchangeRate(data.currency, tenantCurrency, data.due_date);
    return repo.create(tenantId, {
      ...data,
      user_id: userId,
      amount_base: parseFloat((data.amount * rate).toFixed(4)),
      status
    });
  }

  async update(tenantId, id, data) {
    const rec = await repo.findByIdOrFail(tenantId, id);
    const updated = { ...data };
    // Convert ISO date strings to MySQL-compatible DATE format (YYYY-MM-DD)
    if (updated.paid_at) {
      updated.paid_at = new Date(updated.paid_at).toISOString().slice(0, 10);
      updated.status = 'paid';
    } else if (rec.status !== 'paid') {
      const due = new Date(rec.due_date);
      updated.status = new Date() > due ? 'overdue' : rec.status;
    }
    if (updated.due_date) {
      updated.due_date = new Date(updated.due_date).toISOString().slice(0, 10);
    }
    return repo.update(tenantId, id, updated);
  }

  async recordPayment(tenantId, id, { amount, paid_at, notes }) {
    const rec = await repo.findByIdOrFail(tenantId, id);
    const paymentDate = paid_at ? new Date(paid_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const newPaidAmount = parseFloat(((rec.paid_amount || 0) + parseFloat(amount)).toFixed(4));
    const remaining = parseFloat((rec.amount - newPaidAmount).toFixed(4));
    const newStatus = remaining <= 0 ? 'paid' : 'partial';
    const updateData = {
      paid_amount: newPaidAmount,
      status: newStatus,
    };
    if (newStatus === 'paid') updateData.paid_at = paymentDate;
    return repo.update(tenantId, id, updateData);
  }

  async delete(tenantId, id) {
    await repo.findByIdOrFail(tenantId, id);
    return repo.delete(tenantId, id);
  }

  async getOverdue(tenantId) { return repo.getOverdue(tenantId); }
  async getSummary(tenantId) { return repo.getSummary(tenantId); }
}

const svc = new ReceivableService();

// ── Routes ────────────────────────────────────────────────────────────────
export async function receivableRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', async (req) => ({ success: true, data: await svc.list(req.tenantId, req.query) }));
  fastify.get('/overdue', async (req) => ({ success: true, data: await svc.getOverdue(req.tenantId) }));
  fastify.get('/summary', async (req) => ({ success: true, data: await svc.getSummary(req.tenantId) }));
  fastify.get('/:id', async (req) => ({ success: true, data: await svc.getById(req.tenantId, req.params.id) }));

  fastify.post('/', async (req, reply) => {
    const data = await svc.create(req.tenantId, req.userId, req.tenantCurrency, req.body);
    return reply.code(201).send({ success: true, data });
  });

  fastify.put('/:id', async (req) => ({ success: true, data: await svc.update(req.tenantId, req.params.id, req.body) }));

  fastify.post('/:id/payment', async (req, reply) => {
    if (!req.body.amount || req.body.amount <= 0) {
      return reply.code(400).send({ success: false, error: 'Valid amount required' });
    }
    const data = await svc.recordPayment(req.tenantId, req.params.id, req.body);
    return { success: true, data };
  });

  fastify.delete('/:id', async (req) => { await svc.delete(req.tenantId, req.params.id); return { success: true }; });
}
