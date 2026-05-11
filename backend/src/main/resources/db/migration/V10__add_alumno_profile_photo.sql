ALTER TABLE alumno_preferencias ADD COLUMN foto_file_name VARCHAR(255);
ALTER TABLE alumno_preferencias ADD COLUMN foto_content_type VARCHAR(100);
ALTER TABLE alumno_preferencias ADD COLUMN foto_size BIGINT;
ALTER TABLE alumno_preferencias ADD COLUMN foto_content BYTEA;
ALTER TABLE alumno_preferencias ADD COLUMN foto_updated_at TIMESTAMPTZ;
