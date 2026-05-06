CREATE TABLE solicitudes_fct (
  id BIGSERIAL PRIMARY KEY,
  alumno_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  oferta_id BIGINT NOT NULL REFERENCES ofertas_fct(id) ON DELETE CASCADE,
  estado VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_solicitudes_fct_alumno_oferta UNIQUE (alumno_id, oferta_id)
);

CREATE INDEX idx_solicitudes_fct_alumno ON solicitudes_fct(alumno_id);
CREATE INDEX idx_solicitudes_fct_oferta ON solicitudes_fct(oferta_id);
CREATE INDEX idx_solicitudes_fct_estado ON solicitudes_fct(estado);
