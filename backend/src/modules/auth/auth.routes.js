import { AuthService } from './auth.service.js';
import { authenticate } from '../../middleware/auth.js';

const svc = new AuthService();

export async function authRoutes(fastify) {
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['companyName', 'email', 'password', 'name'],
        properties: {
          companyName: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 2 },
          locale: { type: 'string', enum: ['tr', 'en'] },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
          timezone: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const result = await svc.register(req.body);
    return reply.code(201).send({ success: true, data: { tenantId: result.tenant.id } });
  });

  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const result = await svc.login(req.body, fastify);
    return reply.send({ success: true, data: result });
  });

  fastify.post('/refresh', async (req, reply) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return reply.code(400).send({ error: 'refreshToken required' });
    const result = await svc.refresh(refreshToken, fastify);
    return reply.send({ success: true, data: result });
  });

  fastify.post('/logout', { preHandler: [authenticate] }, async (req, reply) => {
    const { refreshToken } = req.body;
    if (refreshToken) await svc.logout(refreshToken);
    return reply.send({ success: true });
  });

  fastify.get('/me', { preHandler: [authenticate] }, async (req, reply) => {
    const pool = (await import('../../config/database.js')).getPool();
    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.locale, 
              t.id as tenantId, t.name as companyName, t.plan, t.base_currency, t.timezone, t.trial_ends_at,
              s.status as subscriptionStatus, s.trial_end
       FROM users u JOIN tenants t ON u.tenant_id = t.id
       LEFT JOIN subscriptions s ON s.tenant_id = t.id
       WHERE u.id = ?`,
      [req.userId]
    );
    return reply.send({ success: true, data: user });
  });
}
