-- Run this once against the database that is currently serving seraomee.com.
-- PostgreSQL only. It is safe to re-run.
ALTER TABLE items ADD COLUMN IF NOT EXISTS web_thumbnail_path VARCHAR;

ALTER TABLE vote_proposals ADD COLUMN IF NOT EXISTS purchase_url VARCHAR(1000);
ALTER TABLE vote_proposals ADD COLUMN IF NOT EXISTS estimated_price INTEGER;
ALTER TABLE vote_proposals ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) NOT NULL DEFAULT 'approved';
ALTER TABLE vote_proposals ADD COLUMN IF NOT EXISTS purchase_status VARCHAR(20) NOT NULL DEFAULT 'voting';

-- Existing public choices remain public after the migration.
UPDATE vote_proposals SET review_status = 'approved' WHERE review_status IS NULL;
