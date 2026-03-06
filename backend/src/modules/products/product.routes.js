import { ProductService } from './product.module.js';
import { authenticate } from '../../middleware/auth.js';

const svc = new ProductService();

export async function productRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', async (req) => {
    const data = await svc.list(req.tenantId, req.query);
    return { success: true, data };
  });

  fastify.get('/alerts', async (req) => {
    const data = await svc.getAlerts(req.tenantId);
    return { success: true, data };
  });

  fastify.get('/stock-value', async (req) => {
    const data = await svc.getStockValue(req.tenantId);
    return { success: true, data };
  });

  fastify.get('/:id', async (req) => {
    const data = await svc.getById(req.tenantId, req.params.id);
    return { success: true, data };
  });

  fastify.post('/', async (req, reply) => {
    const data = await svc.create(req.tenantId, req.body);
    return reply.code(201).send({ success: true, data });
  });

  fastify.put('/:id', async (req) => {
    const data = await svc.update(req.tenantId, req.params.id, req.body);
    return { success: true, data };
  });

  fastify.delete('/:id', async (req) => {
    await svc.delete(req.tenantId, req.params.id);
    return { success: true };
  });

  fastify.post('/:id/stock', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'quantity'],
        properties: {
          type: { type: 'string', enum: ['in', 'out', 'adjustment'] },
          quantity: { type: 'number' },
          notes: { type: 'string' },
        },
      },
    },
  }, async (req) => {
    const data = await svc.adjustStock(req.tenantId, req.params.id, req.userId, req.body);
    return { success: true, data };
  });
}
