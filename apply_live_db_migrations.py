import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('147.93.31.98', port=22, username='root', password='z/g+59A0&Vkse)u(', timeout=10)

migration_sql = """
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'ai';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50) DEFAULT 'openai';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100) DEFAULT 'gpt-4o-mini';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS llm_api_key VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bot_persona VARCHAR(50) DEFAULT 'professional';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS custom_instructions TEXT;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_blocked_topics TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_competitors TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_pii_masking BOOLEAN DEFAULT TRUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_custom_refusal TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_tone_strictness VARCHAR(50) DEFAULT 'standard';

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token_expires_at TIMESTAMP;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS telegram_bot_token VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS auto_crawl_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS crawl_frequency_days INTEGER DEFAULT 7;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMP;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) DEFAULT 'Warm';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_score INTEGER DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unanswered_queries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    question TEXT NOT NULL,
    ai_response TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

UPDATE users SET email_verified = TRUE, is_active = TRUE;
"""

stdin, stdout, stderr = ssh.exec_command('docker exec -i ai_sales_bot_db psql -U postgres -d ai_sales_bot')
stdin.write(migration_sql)
stdin.channel.shutdown_write()

print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())

ssh.close()
