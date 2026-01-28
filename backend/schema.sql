-- Main users table with sync metadata
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  salary DECIMAL(10, 2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(50) DEFAULT 'DB',
  source VARCHAR(50) DEFAULT 'DB',
  version INT DEFAULT 1,
  INDEX idx_updated_at (updated_at),
  INDEX idx_version (version)
);

-- Change log for tracking all modifications
CREATE TABLE change_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  table_name VARCHAR(100) NOT NULL,
  row_id INT NOT NULL,
  operation VARCHAR(20) NOT NULL,
  old_value JSON,
  new_value JSON,
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE,
  INDEX idx_row (table_name, row_id),
  INDEX idx_created (created_at),
  INDEX idx_processed (processed)
);

-- Webhook audit log for debugging
CREATE TABLE webhook_audit (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payload JSON NOT NULL,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at)
);

-- Conflict tracking
CREATE TABLE sync_conflicts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  table_name VARCHAR(100),
  row_id INT,
  sheet_value VARCHAR(500),
  db_value VARCHAR(500),
  resolved_value VARCHAR(500),
  resolution_strategy VARCHAR(50),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resolved (resolved_at)
);
