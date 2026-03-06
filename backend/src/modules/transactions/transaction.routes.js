import { TransactionService } from './transaction.service.js';
import { authenticate, requirePlan } from '../../middleware/auth.js';

const svc = new TransactionService();

export async function transactionRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', async (req) => {
    const { startDate, endDate, type, category, limit, offset } = req.query;
    const data = await svc.list(req.tenantId, { startDate, endDate, type, category, limit: +limit || 50, offset: +offset || 0 });
    return { success: true, data };
  });

  fastify.get('/summary/cashflow', async (req) => {
    const data = await svc.getCashflowData(req.tenantId, req.query);
    return { success: true, data };
  });

  fastify.get('/summary/profitability', async (req) => {
    const data = await svc.getProfitability(req.tenantId, req.query);
    return { success: true, data };
  });

  fastify.get('/summary/category-breakdown', async (req) => {
    const { type, startDate, endDate } = req.query;
    const data = await svc.getCategoryBreakdown(req.tenantId, type, { startDate, endDate });
    return { success: true, data };
  });

  fastify.get('/export', { preHandler: [requirePlan('pro')] }, async (req, reply) => {
    const data = await svc.list(req.tenantId, { limit: 10000 });
    const csv = [
      'date,type,category,description,amount,currency,amount_base',
      ...data.map(t => `${t.transaction_date},${t.type},${t.category || ''},${t.description || ''},${t.amount},${t.currency},${t.amount_base}`)
    ].join('\n');
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="transactions.csv"');
    return reply.send(csv);
  });

  fastify.get('/:id', async (req) => {
    const data = await svc.getById(req.tenantId, req.params.id);
    return { success: true, data };
  });

  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'amount', 'currency', 'transaction_date'],
        properties: {
          type: { type: 'string', enum: ['income', 'expense'] },
          amount: { type: 'number', minimum: 0 },
          currency: { type: 'string' },
          transaction_date: { type: 'string', format: 'date' },
          category: { type: 'string' },
          description: { type: 'string' },
          product_id: { type: 'integer' },
          notes: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const data = await svc.create(req.tenantId, req.userId, req.tenantCurrency, req.body);
    return reply.code(201).send({ success: true, data });
  });

  fastify.put('/:id', async (req) => {
    const data = await svc.update(req.tenantId, req.params.id, req.tenantCurrency, req.body);
    return { success: true, data };
  });

  fastify.delete('/:id', async (req) => {
    await svc.delete(req.tenantId, req.params.id);
    return { success: true };
  });
}
