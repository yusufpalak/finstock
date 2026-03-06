import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository.js';
import { AppError, UnauthorizedError, ValidationError } from '../../shared/errors.js';

const repo = new AuthRepository();

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + crypto.randomBytes(3).toString('hex');
}

export class AuthService {
  async register({ companyName, email, password, name, locale = 'tr', currency = 'TRY', timezone = 'Europe/Istanbul' }) {
    const existing = await repo.findUserByEmail(email);
    if (existing) throw new ValidationError('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = slugify(companyName);

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const tenant = await repo.createTenant({
      name: companyName,
      slug,
      plan: 'trial',
      status: 'active',
      base_currency: currency,
      timezone,
      locale,
      trial_ends_at: trialEnd,
    });

    const user = await repo.createUser({
      tenant_id: tenant.id,
      email,
      password_hash: passwordHash,
      name,
      role: 'owner',
      locale,
    });

    await repo.createSubscription({
      tenant_id: tenant.id,
      plan: 'basic',
      status: 'trialing',
      trial_start: new Date(),
      trial_end: trialEnd,
    });

    return { tenant, user };
  }

  async login({ email, password }, fastify) {
    const user = await repo.findUserByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    if (user.tenant_status === 'suspended') throw new UnauthorizedError('Account suspended');

    await repo.updateLastLogin(user.id);

    const accessToken = fastify.jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await repo.saveRefreshToken(user.id, refreshToken, refreshExp);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, locale: user.locale },
    };
  }

  async refresh(token, fastify) {
    const rt = await repo.findRefreshToken(token);
    if (!rt) throw new UnauthorizedError('Invalid refresh token');

    const accessToken = fastify.jwt.sign(
      { userId: rt.user_id, tenantId: rt.tenant_id, role: rt.role },
      { expiresIn: '15m' }
    );

    return { accessToken };
  }

  async logout(token) {
    await repo.deleteRefreshToken(token);
  }
}
