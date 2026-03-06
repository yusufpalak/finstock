import 'dotenv/config';
import bcrypt from 'bcrypt';
import { getPool } from './config/database.js';

async function seed() {
    const pool = getPool();

    try {
        console.log('🌱 Starting seeding...');

        // 1. Create Admin Tenant
        const [tenantResult] = await pool.query(`
      INSERT IGNORE INTO tenants (name, slug, plan, status, base_currency) 
      VALUES (?, ?, ?, ?, ?)
    `, ['FinStock Admin', 'finstock-admin', 'unlimited', 'active', 'TRY']);

        let tenantId;
        if (tenantResult.insertId) {
            tenantId = tenantResult.insertId;
            console.log('✅ Admin tenant created');
        } else {
            const [[existingTenant]] = await pool.query('SELECT id FROM tenants WHERE slug = ?', ['finstock-admin']);
            if (existingTenant) {
                tenantId = existingTenant.id;
                console.log('ℹ️ Admin tenant already exists');
            } else {
                throw new Error('Tenant creation failed and not found');
            }
        }

        // 2. Create Admin User
        const email = 'admin@finstock.com';
        const password = 'adminpassword123';
        const passwordHash = await bcrypt.hash(password, 12);

        const [userResult] = await pool.query(`
      INSERT IGNORE INTO users (tenant_id, email, password_hash, name, role) 
      VALUES (?, ?, ?, ?, ?)
    `, [tenantId, email, passwordHash, 'System Admin', 'owner']);

        if (userResult.insertId) {
            console.log('✅ Admin user created');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: ${password}`);
        } else {
            console.log('ℹ️ Admin user already exists');
        }

        // 3. Create Subscription (active/unlimited)
        await pool.query(`
      INSERT IGNORE INTO subscriptions (tenant_id, plan, status) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE plan = 'unlimited', status = 'active'
    `, [tenantId, 'unlimited', 'active']);

        console.log('✅ Subscription set to unlimited');
        console.log('✨ Seeding completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:');
        console.error(err);
        process.exit(1);
    }
}

seed();
