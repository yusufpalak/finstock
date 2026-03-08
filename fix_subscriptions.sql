-- 1. Extend subscriptions.plan ENUM to include 'trial' and 'unlimited'
ALTER TABLE subscriptions 
  MODIFY COLUMN plan ENUM('trial','basic','pro','unlimited') NOT NULL DEFAULT 'basic';

-- 2. Extend subscriptions.status ENUM
ALTER TABLE subscriptions 
  MODIFY COLUMN status ENUM('trialing','active','past_due','cancelled','unlimited') NOT NULL DEFAULT 'trialing';

-- 3. Add subscription_id FK to tenants (no IF NOT EXISTS - run once)
ALTER TABLE tenants 
  ADD COLUMN subscription_id INT UNSIGNED NULL,
  ADD CONSTRAINT fk_tenant_subscription 
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

-- 4. Link each tenant's existing subscription row
UPDATE tenants t
JOIN subscriptions s ON s.tenant_id = t.id
SET t.subscription_id = s.id;

-- 5. Sync subscriptions.plan with tenants.plan
UPDATE subscriptions s
JOIN tenants t ON s.tenant_id = t.id
SET s.plan = t.plan
WHERE t.plan IN ('trial','basic','pro','unlimited');

-- 6. Verify
SELECT t.id as tenant_id, t.name, t.plan as tenant_plan, 
       t.subscription_id, s.plan as sub_plan, s.status, s.trial_end
FROM tenants t 
LEFT JOIN subscriptions s ON s.id = t.subscription_id;
