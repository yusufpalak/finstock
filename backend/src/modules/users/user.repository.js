import { getPool } from '../../config/database.js';

export class UserRepository {
    constructor() { this.pool = getPool(); }

    async listAll() {
        const [rows] = await this.pool.query(
            'SELECT u.id, u.email, u.name, u.role, u.is_active, u.last_login_at, u.created_at, u.tenant_id, t.name as tenant_name \
             FROM users u \
             JOIN tenants t ON u.tenant_id = t.id'
        );
        return rows;
    }

    async listByTenantId(tenantId) {
        const [rows] = await this.pool.query(
            'SELECT u.id, u.email, u.name, u.role, u.is_active, u.last_login_at, u.created_at, u.tenant_id, t.name as tenant_name \
             FROM users u \
             JOIN tenants t ON u.tenant_id = t.id \
             WHERE u.tenant_id = ?',
            [tenantId]
        );
        return rows;
    }

    async findById(tenantId, id) {
        const [[row]] = await this.pool.query(
            'SELECT id, email, name, role, is_active FROM users WHERE tenant_id = ? AND id = ?',
            [tenantId, id]
        );
        return row;
    }

    async findByEmail(email) {
        const [[row]] = await this.pool.query('SELECT id FROM users WHERE email = ?', [email]);
        return row;
    }

    async create(data) {
        const [result] = await this.pool.query('INSERT INTO users SET ?', [data]);
        return { id: result.insertId, ...data };
    }

    async update(tenantId, id, data) {
        await this.pool.query('UPDATE users SET ? WHERE tenant_id = ? AND id = ?', [data, tenantId, id]);
    }

    async delete(tenantId, id) {
        await this.pool.query('DELETE FROM users WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    }
}
