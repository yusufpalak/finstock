import { getPool } from '../config/database.js';
import { NotFoundError } from './errors.js';

export class BaseRepository {
  constructor(tableName) {
    this.table = tableName;
    this.pool = getPool();
  }

  // CRITICAL: All queries MUST pass tenantId — enforced here
  async findAll(tenantId, { where = {}, orderBy = 'created_at DESC', limit = 50, offset = 0 } = {}) {
    const conditions = ['tenant_id = ?'];
    const values = [tenantId];

    for (const [key, val] of Object.entries(where)) {
      if (val !== undefined && val !== null) {
        conditions.push(`${key} = ?`);
        values.push(val);
      }
    }

    const sql = `SELECT * FROM ${this.table} WHERE ${conditions.join(' AND ')} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    const [rows] = await this.pool.query(sql, values);
    return rows;
  }

  async findById(tenantId, id) {
    const [rows] = await this.pool.query(
      `SELECT * FROM ${this.table} WHERE tenant_id = ? AND id = ? LIMIT 1`,
      [tenantId, id]
    );
    return rows[0] || null;
  }

  async findByIdOrFail(tenantId, id) {
    const row = await this.findById(tenantId, id);
    if (!row) throw new NotFoundError(this.table);
    return row;
  }

  async count(tenantId, where = {}) {
    const conditions = ['tenant_id = ?'];
    const values = [tenantId];
    for (const [key, val] of Object.entries(where)) {
      if (val !== undefined && val !== null) {
        conditions.push(`${key} = ?`);
        values.push(val);
      }
    }
    const [[{ total }]] = await this.pool.query(
      `SELECT COUNT(*) as total FROM ${this.table} WHERE ${conditions.join(' AND ')}`,
      values
    );
    return total;
  }

  async create(tenantId, data) {
    const payload = { ...data, tenant_id: tenantId };
    const [result] = await this.pool.query(
      `INSERT INTO ${this.table} SET ?`,
      [payload]
    );
    return this.findById(tenantId, result.insertId);
  }

  async update(tenantId, id, data) {
    await this.pool.query(
      `UPDATE ${this.table} SET ? WHERE tenant_id = ? AND id = ?`,
      [data, tenantId, id]
    );
    return this.findByIdOrFail(tenantId, id);
  }

  async delete(tenantId, id) {
    const [result] = await this.pool.query(
      `DELETE FROM ${this.table} WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return result.affectedRows > 0;
  }

  async query(sql, values = []) {
    const [rows] = await this.pool.query(sql, values);
    return rows;
  }
}
