-- RecoverAI Database Schema

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    total_payments INT DEFAULT 0,
    successful_payments INT DEFAULT 0,
    failed_payments INT DEFAULT 0,
    customer_tenure_days INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL, -- 'FAILED', 'RECOVERED', 'ABANDONED', 'PENDING', 'SUCCESS'
    failure_reason VARCHAR(100), -- 'BANK_TIMEOUT', 'INSUFFICIENT_FUNDS', 'CARD_EXPIRED', 'NETWORK_ERROR', 'CHECKOUT_ABANDONED', 'AUTHENTICATION_FAILED'
    payment_method VARCHAR(50), -- 'UPI', 'CARD', 'NET_BANKING', 'WALLET'
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS recovery_cases (
    id VARCHAR(50) PRIMARY KEY,
    payment_id VARCHAR(50) NOT NULL,
    risk_score DECIMAL(5, 2), -- 0.00 to 100.00
    recovery_probability DECIMAL(5, 2), -- 0.00 to 100.00 %
    recommended_action VARCHAR(50), -- 'RETRY', 'PAYMENT_LINK', 'DISCOUNT_LINK', 'HUMAN_ESCALATE', 'STOP'
    status VARCHAR(20) NOT NULL, -- 'ACTIVE', 'RECOVERED', 'ESCALATED', 'ABORTED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE TABLE IF NOT EXISTS agent_actions (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    confidence DECIMAL(5, 2),
    result VARCHAR(50), -- 'SUCCESS', 'FAILED', 'PENDING', 'ESCALATED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES recovery_cases(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50),
    agent_id VARCHAR(50) DEFAULT 'RecoverAI-Core-Agent',
    action VARCHAR(100) NOT NULL,
    input_data TEXT,
    decision_data TEXT,
    status VARCHAR(20) DEFAULT 'SUCCESS',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guardrails_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value VARCHAR(100) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Guardrail Settings
INSERT OR REPLACE INTO guardrails_config (config_key, config_value, description) VALUES
('MAX_RETRIES', '2', 'Maximum automated payment retry attempts'),
('HIGH_VALUE_THRESHOLD', '25000', 'Transactions above this amount require human escalation (INR)'),
('MAX_AUTOMATIC_ACTION', '50000', 'Maximum transaction amount for fully automated action'),
('MAX_DISCOUNT_PERCENT', '10', 'Maximum discount percentage allowed for recovery payment links'),
('AGENT_SPEND_LIMIT', '5000', 'Maximum promotional expense limit per transaction (INR)'),
('AUTO_RECOVERY_ENABLED', 'true', 'Enable real-time autonomous recovery engine');
