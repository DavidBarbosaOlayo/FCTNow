ALTER TABLE app_users ADD COLUMN foto_file_name VARCHAR(255);
ALTER TABLE app_users ADD COLUMN foto_content_type VARCHAR(100);
ALTER TABLE app_users ADD COLUMN foto_size BIGINT;
ALTER TABLE app_users ADD COLUMN foto_content BYTEA;
ALTER TABLE app_users ADD COLUMN foto_updated_at TIMESTAMPTZ;
