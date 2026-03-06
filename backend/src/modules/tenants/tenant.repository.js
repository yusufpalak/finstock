import { getPool } from '../../config/database.js';

export class TenantRepository {
    constructor() { this.pool = getPool(); }

    async list() {
        const [rows] = await this.pool.query(
            'SELECT id, name, slug, plan, status FROM tenants'
        );
        return rows;
    }

    async findById(id) {
        const [[row]] = await this.pool.query(
            'SELECT * FROM tenants WHERE id = ? LIMIT 1',
            [id]
        );
        return row;
    }

    async update(id, data) {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);
        await this.pool.query(
            `UPDATE tenants SET ${fields} WHERE id = ?`,
            [...values, id]
        );
    }
}
