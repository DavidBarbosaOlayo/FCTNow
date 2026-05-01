CREATE TABLE backend_metadata (
  id BIGSERIAL PRIMARY KEY,
  metadata_key VARCHAR(100) NOT NULL UNIQUE,
  metadata_value VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO backend_metadata (metadata_key, metadata_value)
VALUES ('application', 'fctnow-backend');
