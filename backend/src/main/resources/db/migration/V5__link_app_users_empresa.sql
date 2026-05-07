ALTER TABLE app_users ADD COLUMN empresa_id BIGINT;

ALTER TABLE app_users
  ADD CONSTRAINT fk_app_users_empresa
  FOREIGN KEY (empresa_id) REFERENCES empresas(id);

CREATE INDEX idx_app_users_empresa ON app_users(empresa_id);
