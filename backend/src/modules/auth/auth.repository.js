// ── auth.repository.js ────────────────────────────────────────────────────
import { getPool } from '../../config/database.js';

export class AuthRepository {
  constructor() { this.pool = getPool(); }

  async findTenantBySlug(slug) {
    const [[row]] = await this.pool.query('SELECT * FROM tenants WHERE slug = ? LIMIT 1', [slug]);
    return row;
  }

  async createTenant(data) {
    const [result] = await this.pool.query('INSERT INTO tenants SET ?', [data]);
    const [[tenant]] = await this.pool.query('SELECT * FROM tenants WHERE id = ?', [result.insertId]);
    return tenant;
  }

  async createUser(data) {
    const [result] = await this.pool.query('INSERT INTO users SET ?', [data]);
    const [[user]] = await this.pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    return user;
  }

  async createSubscription(data) {
    await this.pool.query('INSERT INTO subscriptions SET ?', [data]);
  }

  async findUserByEmail(email) {
    const [[row]] = await this.pool.query(
      'SELECT u.*, t.plan as tenant_plan, t.status as tenant_status FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = ? AND u.is_active = 1 LIMIT 1',
      [email]
    );
    return row;
  }

  async updateLastLogin(userId) {
    await this.pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userId]);
  }

  async saveRefreshToken(userId, token, expiresAt) {
    await this.pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires_at = ?',
      [userId, token, expiresAt, token, expiresAt]
    );
  }

  async findRefreshToken(token) {
    const [[row]] = await this.pool.query(
      'SELECT rt.*, u.tenant_id, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token = ? AND rt.expires_at > NOW() LIMIT 1',
      [token]
    );
    return row;
  }

  async deleteRefreshToken(token) {
    await this.pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
  }
}
