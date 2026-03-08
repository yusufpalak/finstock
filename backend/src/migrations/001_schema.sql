-- Finance & Stock Mini ERP — Database Migrations
-- Run in order. All tables include tenant_id for strict isolation.

SET FOREIGN_KEY_CHECKS = 0;

-- ── 001: Tenants ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) NOT NULL UNIQUE,
  plan            ENUM('trial','basic','pro','unlimited') NOT NULL DEFAULT 'trial',
  subscription_id INT UNSIGNED NULL,
  status          ENUM('active','suspended','cancelled') NOT NULL DEFAULT 'active',
  base_currency   CHAR(3) NOT NULL DEFAULT 'TRY',
  timezone        VARCHAR(50) NOT NULL DEFAULT 'Europe/Istanbul',
  locale          VARCHAR(10) NOT NULL DEFAULT 'tr',
  trial_ends_at   DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 002: Users ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id       INT UNSIGNED NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  role            ENUM('owner','staff') NOT NULL DEFAULT 'staff',
  locale          VARCHAR(10) NOT NULL DEFAULT 'tr',
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at   DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_users_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 003: Refresh Tokens ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 004: Subscriptions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id             INT UNSIGNED NOT NULL UNIQUE,
  plan                  ENUM('trial','basic','pro','unlimited') NOT NULL DEFAULT 'basic',
  status                ENUM('trialing','active','past_due','cancelled','unlimited') NOT NULL DEFAULT 'trialing',
  trial_start           DATE NULL,
  trial_end             DATE NULL,
  current_period_start  DATE NULL,
  current_period_end    DATE NULL,
  payment_provider      VARCHAR(50) NULL,
  payment_provider_id   VARCHAR(255) NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 005: Products ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id             INT UNSIGNED NOT NULL,
  name                  VARCHAR(255) NOT NULL,
  sku                   VARCHAR(100) NULL,
  category              VARCHAR(100) NULL,
  unit                  VARCHAR(50) NULL DEFAULT 'adet',
  cost_price            DECIMAL(15,4) NOT NULL DEFAULT 0,
  selling_price         DECIMAL(15,4) NOT NULL DEFAULT 0,
  currency              CHAR(3) NOT NULL DEFAULT 'TRY',
  stock_quantity        DECIMAL(15,4) NOT NULL DEFAULT 0,
  stock_alert_threshold DECIMAL(15,4) NOT NULL DEFAULT 5,
  is_active             TINYINT(1) NOT NULL DEFAULT 1,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_products_tenant (tenant_id),
  INDEX idx_products_tenant_sku (tenant_id, sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 006: Transactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id         INT UNSIGNED NOT NULL,
  type              ENUM('income','expense') NOT NULL,
  category          VARCHAR(100) NULL,
  description       VARCHAR(500) NULL,
  amount            DECIMAL(15,4) NOT NULL,
  currency          CHAR(3) NOT NULL,
  amount_base       DECIMAL(15,4) NOT NULL,
  exchange_rate     DECIMAL(15,6) NOT NULL DEFAULT 1.000000,
  transaction_date  DATE NOT NULL,
  product_id        INT UNSIGNED NULL,
  user_id           INT UNSIGNED NOT NULL,
  notes             TEXT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_transactions_tenant_date (tenant_id, transaction_date),
  INDEX idx_transactions_tenant_type (tenant_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 007: Receivables ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receivables (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id       INT UNSIGNED NOT NULL,
  customer_name   VARCHAR(255) NOT NULL,
  customer_email  VARCHAR(255) NULL,
  amount          DECIMAL(15,4) NOT NULL,
  currency        CHAR(3) NOT NULL,
  amount_base     DECIMAL(15,4) NOT NULL,
  paid_amount     DECIMAL(15,4) NOT NULL DEFAULT 0,
  due_date        DATE NOT NULL,
  paid_at         DATE NULL,
  status          ENUM('pending','partial','paid','overdue') NOT NULL DEFAULT 'pending',
  description     VARCHAR(500) NULL,
  user_id         INT UNSIGNED NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_receivables_tenant_status (tenant_id, status, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 008: Stock Movements ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id       INT UNSIGNED NOT NULL,
  product_id      INT UNSIGNED NOT NULL,
  type            ENUM('in','out','adjustment') NOT NULL,
  quantity        DECIMAL(15,4) NOT NULL,
  quantity_before DECIMAL(15,4) NOT NULL,
  quantity_after  DECIMAL(15,4) NOT NULL,
  reference_type  VARCHAR(50) NULL,
  reference_id    INT UNSIGNED NULL,
  user_id         INT UNSIGNED NOT NULL,
  notes           VARCHAR(500) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_stock_movements_tenant_product (tenant_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 009: Exchange Rates ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_rates (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_currency   CHAR(3) NOT NULL,
  to_currency     CHAR(3) NOT NULL,
  rate            DECIMAL(18,8) NOT NULL,
  rate_date       DATE NOT NULL,
  source          VARCHAR(50) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_exchange_rates (from_currency, to_currency, rate_date),
  INDEX idx_rates_lookup (from_currency, to_currency, rate_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
