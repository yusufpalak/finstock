// ── product.repository.js ─────────────────────────────────────────────────
import { BaseRepository } from '../../shared/base.repository.js';

export class ProductRepository extends BaseRepository {
  constructor() { super('products'); }

  async findAlerts(tenantId) {
    return this.query(
      `SELECT * FROM products WHERE tenant_id = ? AND is_active = 1 AND stock_quantity <= stock_alert_threshold ORDER BY stock_quantity ASC`,
      [tenantId]
    );
  }

  async getStockValue(tenantId) {
    const [[row]] = await this.pool.query(
      `SELECT 
        SUM(stock_quantity * cost_price) as total_cost_value,
        SUM(stock_quantity * selling_price) as total_selling_value,
        COUNT(*) as total_products,
        SUM(CASE WHEN stock_quantity <= stock_alert_threshold THEN 1 ELSE 0 END) as alert_count
       FROM products WHERE tenant_id = ? AND is_active = 1`,
      [tenantId]
    );
    return row;
  }

  async addStockMovement(tenantId, productId, userId, { type, quantity, quantityBefore, quantityAfter, notes }) {
    await this.pool.query(
      `INSERT INTO stock_movements (tenant_id, product_id, type, quantity, quantity_before, quantity_after, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, productId, type, quantity, quantityBefore, quantityAfter, userId, notes]
    );
  }

  async getMovements(tenantId, productId, limit = 50) {
    return this.query(
      `SELECT sm.*, u.name as user_name FROM stock_movements sm 
       JOIN users u ON sm.user_id = u.id
       WHERE sm.tenant_id = ? AND sm.product_id = ? ORDER BY sm.created_at DESC LIMIT ?`,
      [tenantId, productId, limit]
    );
  }
}

// ── product.service.js ────────────────────────────────────────────────────
export class ProductService {
  constructor() { this.repo = new ProductRepository(); }

  async list(tenantId, { search, category, limit = 50, offset = 0 } = {}) {
    if (search) {
      return this.repo.query(
        `SELECT * FROM products WHERE tenant_id = ? AND is_active = 1 AND (name LIKE ? OR sku LIKE ?) ORDER BY name ASC LIMIT ? OFFSET ?`,
        [tenantId, `%${search}%`, `%${search}%`, limit, offset]
      );
    }
    return this.repo.findAll(tenantId, { where: { is_active: 1, ...(category ? { category } : {}) }, orderBy: 'name ASC', limit, offset });
  }

  async getById(tenantId, id) {
    const product = await this.repo.findByIdOrFail(tenantId, id);
    const movements = await this.repo.getMovements(tenantId, id);
    return { ...product, movements };
  }

  async create(tenantId, data) {
    return this.repo.create(tenantId, data);
  }

  async update(tenantId, id, data) {
    await this.repo.findByIdOrFail(tenantId, id);
    return this.repo.update(tenantId, id, data);
  }

  async delete(tenantId, id) {
    await this.repo.findByIdOrFail(tenantId, id);
    return this.repo.update(tenantId, id, { is_active: 0 });
  }

  async adjustStock(tenantId, id, userId, { type, quantity, notes }) {
    const product = await this.repo.findByIdOrFail(tenantId, id);
    const quantityBefore = product.stock_quantity;
    let quantityAfter;

    if (type === 'in') quantityAfter = quantityBefore + quantity;
    else if (type === 'out') quantityAfter = quantityBefore - quantity;
    else quantityAfter = quantity; // adjustment

    await this.repo.update(tenantId, id, { stock_quantity: quantityAfter });
    await this.repo.addStockMovement(tenantId, id, userId, { type, quantity, quantityBefore, quantityAfter, notes });

    return this.repo.findById(tenantId, id);
  }

  async getAlerts(tenantId) {
    return this.repo.findAlerts(tenantId);
  }

  async getStockValue(tenantId) {
    return this.repo.getStockValue(tenantId);
  }
}
