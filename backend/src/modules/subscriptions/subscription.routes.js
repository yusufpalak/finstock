import { authenticate } from '../../middleware/auth.js';
import { getPool } from '../../config/database.js';

export async function subscriptionRoutes(fastify) {
    fastify.addHook('preHandler', authenticate);

    // Only owner + unlimited plan can access
    fastify.addHook('preHandler', async (req, reply) => {
        if (req.userRole !== 'owner') {
            return reply.code(403).send({ success: false, error: 'Owner access required' });
        }
        if (req.tenantPlan !== 'unlimited') {
            return reply.code(403).send({ success: false, error: 'Unlimited plan required' });
        }
    });

    // GET /subscriptions — list all tenants with their subscriptions
    fastify.get('/', async (req, reply) => {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT t.id as tenant_id, t.name as tenant_name, t.plan as tenant_plan,
              s.id as subscription_id, s.plan as sub_plan, s.status,
              s.trial_start, s.trial_end, s.current_period_start, s.current_period_end,
              (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.is_active = 1) as user_count
       FROM tenants t
       LEFT JOIN subscriptions s ON s.id = t.subscription_id
       ORDER BY t.id ASC`
        );
        return { success: true, data: rows };
    });

    // GET /subscriptions/:tenantId — single tenant subscription detail
    fastify.get('/:tenantId', async (req, reply) => {
        const pool = getPool();
        const [[row]] = await pool.query(
            `SELECT t.id as tenant_id, t.name as tenant_name, t.plan as tenant_plan,
              s.id as subscription_id, s.plan as sub_plan, s.status,
              s.trial_start, s.trial_end, s.current_period_start, s.current_period_end
       FROM tenants t
       LEFT JOIN subscriptions s ON s.id = t.subscription_id
       WHERE t.id = ?`,
            [req.params.tenantId]
        );
        if (!row) return reply.code(404).send({ success: false, error: 'Tenant not found' });
        return { success: true, data: row };
    });

    // PUT /subscriptions/:tenantId — update plan and/or dates
    fastify.put('/:tenantId', async (req, reply) => {
        const pool = getPool();
        const { plan, status, trial_end, current_period_end } = req.body;
        const tenantId = req.params.tenantId;

        const VALID_PLANS = ['trial', 'basic', 'pro', 'unlimited'];
        const VALID_STATUS = ['trialing', 'active', 'past_due', 'cancelled', 'unlimited'];
        if (plan && !VALID_PLANS.includes(plan)) {
            return reply.code(400).send({ success: false, error: 'Invalid plan' });
        }
        if (status && !VALID_STATUS.includes(status)) {
            return reply.code(400).send({ success: false, error: 'Invalid status' });
        }

        // Get existing subscription
        const [[sub]] = await pool.query(
            `SELECT s.id FROM subscriptions s 
       JOIN tenants t ON t.subscription_id = s.id 
       WHERE t.id = ?`,
            [tenantId]
        );

        if (!sub) {
            return reply.code(404).send({ success: false, error: 'Subscription not found' });
        }

        // Update subscription row — use !== undefined so explicit null clears the field
        const updates = {};
        if (plan) updates.plan = plan;
        if (status) updates.status = status;
        if (trial_end !== undefined) updates.trial_end = trial_end || null;
        if (current_period_end !== undefined) updates.current_period_end = current_period_end || null;

        if (Object.keys(updates).length > 0) {
            const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
            await pool.query(
                `UPDATE subscriptions SET ${setClauses} WHERE id = ?`,
                [...Object.values(updates), sub.id]
            );
        }

        // Sync tenants.plan with subscription plan
        if (plan) {
            await pool.query(`UPDATE tenants SET plan = ? WHERE id = ?`, [plan, tenantId]);
        }

        return { success: true, message: 'Subscription updated successfully' };
    });
}
