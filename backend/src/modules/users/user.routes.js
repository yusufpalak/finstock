import { UserService } from './user.service.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const svc = new UserService();

export async function userRoutes(fastify) {
    fastify.addHook('preHandler', authenticate);

    // Profile routes (Self-management)
    fastify.get('/me', async (req) => {
        const data = await svc.update(req.tenantId, req.userId, {}); // Just a fetch
        return { success: true, data };
    });

    fastify.patch('/me', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    password: { type: 'string', minLength: 6 }
                }
            }
        }
    }, async (req) => {
        const data = await svc.update(req.tenantId, req.userId, req.body);
        return { success: true, data };
    });

    // Management routes (Owners only)
    fastify.register(async (adminRoutes) => {
        adminRoutes.addHook('preHandler', requireRole('owner'));

        adminRoutes.get('/', async (req) => {
            const { tenantId } = req.query;
            let data;

            if (req.userRole === 'owner' && req.tenantPlan === 'unlimited') {
                if (tenantId) {
                    data = await svc.listByTenantId(tenantId);
                } else {
                    data = await svc.listAll();
                }
            } else {
                data = await svc.listByTenantId(req.tenantId);
            }

            return { success: true, data };
        });

        fastify.post('/', {
            schema: {
                body: {
                    type: 'object',
                    required: ['email', 'password', 'name'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                        name: { type: 'string' },
                        role: { type: 'string', enum: ['owner', 'staff'] }
                    }
                }
            }
        }, async (req, reply) => {
            const data = await svc.create(req.tenantId, req.body);
            return reply.code(201).send({ success: true, data });
        });

        fastify.patch('/:id', {
            schema: {
                body: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                        name: { type: 'string' },
                        role: { type: 'string', enum: ['owner', 'staff'] },
                        is_active: { type: 'integer', enum: [0, 1] }
                    }
                }
            }
        }, async (req) => {
            const data = await svc.update(req.tenantId, req.params.id, req.body);
            return { success: true, data };
        });

        adminRoutes.delete('/:id', async (req) => {
            await svc.delete(req.tenantId, req.params.id);
            return { success: true };
        });
    });
}
