import { TenantRepository } from './tenant.repository.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const repo = new TenantRepository();

export async function tenantRoutes(fastify) {
    fastify.addHook('preHandler', authenticate);
    fastify.addHook('preHandler', requireRole('owner'));

    fastify.get('/', async (req) => {
        // Only allow listing all tenants if the current tenant is 'unlimited' (Super Admin)
        if (req.tenantPlan !== 'unlimited') {
            return { success: true, data: [] };
        }
        const data = await repo.list();
        return { success: true, data };
    });

    fastify.get('/me', async (req) => {
        const data = await repo.findById(req.tenantId);
        return { success: true, data };
    });

    fastify.patch('/me', async (req, reply) => {
        // Strict restriction: only owner + unlimited plan
        if (req.userRole !== 'owner' || req.tenantPlan !== 'unlimited') {
            return reply.code(403).send({ success: false, error: 'Unauthorized: Only Super Admin owners can change company name' });
        }

        const { name } = req.body;
        if (!name) return reply.code(400).send({ success: false, error: 'Name is required' });

        await repo.update(req.tenantId, { name });
        const updated = await repo.findById(req.tenantId);
        return { success: true, data: updated };
    });

    fastify.patch('/:id', async (req, reply) => {
        // Only Super Admin can update any tenant
        if (req.userRole !== 'owner' || req.tenantPlan !== 'unlimited') {
            return reply.code(403).send({ success: false, error: 'Unauthorized' });
        }

        const { name } = req.body;
        if (!name) return reply.code(400).send({ success: false, error: 'Name is required' });

        await repo.update(req.params.id, { name });
        const updated = await repo.findById(req.params.id);
        return { success: true, data: updated };
    });
}
