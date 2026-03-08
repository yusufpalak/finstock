import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/env.js';
import { AppError } from './shared/errors.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { transactionRoutes } from './modules/transactions/transaction.routes.js';
import { productRoutes } from './modules/products/product.routes.js';
import { receivableRoutes } from './modules/receivables/receivable.module.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { currencyRoutes } from './modules/currencies/currency.routes.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: config.nodeEnv !== 'test',
    ajv: { customOptions: { allErrors: true } },
  });

  // ── Plugins ──────────────────────────────────────────────────────────────
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: [config.frontendUrl],
    credentials: true,
  });
  await fastify.register(jwt, { secret: config.jwt.secret });
  await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // ── Global error handler ─────────────────────────────────────────────────
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        success: false,
        error: error.message,
        code: error.code,
        ...(error.upgrade ? { upgrade: true } : {}),
      });
    }

    if (error.validation) {
      return reply.code(422).send({
        success: false,
        error: 'Validation failed',
        details: error.validation,
      });
    }

    return reply.code(500).send({
      success: false,
      error: config.nodeEnv === 'production' ? 'Internal server error' : error.message,
    });
  });

  // ── Routes ───────────────────────────────────────────────────────────────
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  fastify.register(transactionRoutes, { prefix: '/api/v1/transactions' });
  fastify.register(productRoutes, { prefix: '/api/v1/products' });
  fastify.register(receivableRoutes, { prefix: '/api/v1/receivables' });
  fastify.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
  fastify.register(currencyRoutes, { prefix: '/api/v1/currencies' });
  fastify.register(import('./modules/users/user.routes.js').then(m => m.userRoutes), { prefix: '/api/v1/users' });
  fastify.register(import('./modules/tenants/tenant.routes.js').then(m => m.tenantRoutes), { prefix: '/api/v1/tenants' });
  fastify.register(import('./modules/subscriptions/subscription.routes.js').then(m => m.subscriptionRoutes), { prefix: '/api/v1/subscriptions' });

  return fastify;
}
