CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account_principals (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  principal_id INTEGER NOT NULL REFERENCES principals(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('owner', 'agent', 'collaborator')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (account_id, principal_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_account_principals_principal ON account_principals(principal_id);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
