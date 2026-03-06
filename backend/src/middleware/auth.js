import { getPool } from '../config/database.js';
import { UnauthorizedError, ForbiddenError, PlanError } from '../shared/errors.js';

// ── JWT + Tenant context injection ─────────────────────────────────────────
export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();

    const pool = getPool();
    const [[tenant]] = await pool.query(
      'SELECT id, plan, status, base_currency, timezone, locale FROM tenants WHERE id = ? LIMIT 1',
      [request.user.tenantId]
    );

    if (!tenant) throw new ForbiddenError('Tenant not found');
    if (tenant.status === 'suspended') throw new ForbiddenError('Account suspended');
    if (tenant.status === 'cancelled') throw new ForbiddenError('Account cancelled');

    // Trial check — bypass if unlimited
    if (tenant.plan === 'unlimited') {
      request.tenantId = tenant.id;
      request.tenantPlan = tenant.plan;
      request.tenantCurrency = tenant.base_currency;
      request.tenantTimezone = tenant.timezone;
      request.userId = request.user.userId;
      request.userRole = request.user.role;
      return;
    }

    const [[sub]] = await pool.query(
      'SELECT status, trial_end FROM subscriptions WHERE tenant_id = ? LIMIT 1',
      [tenant.id]
    );

    if (sub?.status === 'trialing' && sub.trial_end) {
      const now = new Date();
      const trialEnd = new Date(sub.trial_end);
      if (now > trialEnd) {
        await pool.query(
          "UPDATE tenants SET plan = 'basic', status = 'active' WHERE id = ?",
          [tenant.id]
        );
        await pool.query(
          "UPDATE subscriptions SET status = 'active' WHERE tenant_id = ?",
          [tenant.id]
        );
        tenant.plan = 'basic';
      }
    }

    // Inject into request
    request.tenantId = tenant.id;
    request.tenantPlan = tenant.plan;
    request.tenantCurrency = tenant.base_currency;
    request.tenantTimezone = tenant.timezone;
    request.userId = request.user.userId;
    request.userRole = request.user.role;
  } catch (err) {
    if (err.statusCode) throw err;
    throw new UnauthorizedError('Invalid or expired token');
  }
}

// ── RBAC: require owner role ───────────────────────────────────────────────
export function requireRole(...roles) {
  return async (request, reply) => {
    if (!roles.includes(request.userRole)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}

// ── Plan gating ────────────────────────────────────────────────────────────
export function requirePlan(plan) {
  return async (request, reply) => {
    const planOrder = { trial: 0, basic: 1, pro: 2, unlimited: 3 };
    const required = planOrder[plan] ?? 2;
    const current = planOrder[request.tenantPlan] ?? 0;
    if (current < required) {
      throw new PlanError();
    }
  };
}
