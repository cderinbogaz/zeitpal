-- Migration: Fix verification_tokens table schema for @auth/d1-adapter compatibility
-- The D1 adapter expects:
--   - expires as datetime (not TEXT)
--   - PRIMARY KEY (token) only (not composite with identifier)

-- Step 1: Create the new table with correct schema
CREATE TABLE IF NOT EXISTS verification_tokens_new (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL DEFAULT NULL,
    expires datetime NOT NULL DEFAULT NULL,
    PRIMARY KEY (token)
);

-- Step 2: Copy existing data (if any)
INSERT OR IGNORE INTO verification_tokens_new (identifier, token, expires)
SELECT identifier, token, expires FROM verification_tokens;

-- Step 3: Drop the old table
DROP TABLE IF EXISTS verification_tokens;

-- Step 4: Rename the new table
ALTER TABLE verification_tokens_new RENAME TO verification_tokens;
