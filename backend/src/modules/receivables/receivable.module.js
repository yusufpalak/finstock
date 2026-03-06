import { BaseRepository } from '../../shared/base.repository.js';
import { authenticate } from '../../middleware/auth.js';
import { getExchangeRate } from '../../shared/currency.service.js';

// ── Repository ────────────────────────────────────────────────────────────
class ReceivableRepository extends BaseRepository {
  constructor() { super('receivables'); }

  async getOverdue(tenantId) {
    return this.query(
      `SELECT * FROM receivables WHERE tenant_id = ? AND status IN ('pending','partial') AND due_date < CURDATE() ORDER BY due_date ASC`,
      [tenantId]
    );
  }

  async getSummary(tenantId) {
    const [rows] = await this.pool.query(
      `SELECT currency,
        SUM(CASE WHEN status IN ('pending','partial') THEN amount ELSE 0 END) as outstanding,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as collected,
        COUNT(CASE WHEN status IN ('pending','partial') AND due_date < CURDATE() THEN 1 END) as overdue_count
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
    if (data.paid_at) updated.status = 'paid';
    else if (rec.status !== 'paid') {
      const due = new Date(rec.due_date);
      updated.status = new Date() > due ? 'overdue' : rec.status;
    }
    return repo.update(tenantId, id, updated);
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
  fastify.delete('/:id', async (req) => { await svc.delete(req.tenantId, req.params.id); return { success: true }; });
}
