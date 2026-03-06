import { fetchTCMBRates } from '../../shared/tcmb.js';
import { authenticate } from '../../middleware/auth.js';

let cachedRates = null;
let lastFetch = 0;
const CACHE_TTL = 3600000; // 1 hour

async function getRates() {
    const now = Date.now();
    if (!cachedRates || (now - lastFetch > CACHE_TTL)) {
        try {
            cachedRates = await fetchTCMBRates();
            lastFetch = now;
        } catch (err) {
            if (!cachedRates) throw err;
            // If fetch fails but we have cache, return cache
        }
    }
    return cachedRates;
}

export async function currencyRoutes(fastify) {
    fastify.addHook('preHandler', authenticate);

    fastify.get('/rates', async () => {
        const rates = await getRates();
        return { success: true, data: rates };
    });

    fastify.get('/convert', async (req) => {
        const { from, to, amount } = req.query;
        const rates = await getRates();

        if (!rates[from] || !rates[to]) {
            throw new Error('Invalid currency code');
        }

        const valueInTry = amount * rates[from].selling;
        const result = valueInTry / rates[to].selling;

        return {
            success: true,
            data: {
                from, to, amount, result,
                rate: rates[from].selling / rates[to].selling
            }
        };
    });
}
