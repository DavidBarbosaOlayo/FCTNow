CREATE TABLE asignaciones_fct (
  id BIGSERIAL PRIMARY KEY,
  solicitud_id BIGINT NOT NULL REFERENCES solicitudes_fct(id) ON DELETE RESTRICT,
  alumno_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  oferta_id BIGINT NOT NULL REFERENCES ofertas_fct(id) ON DELETE RESTRICT,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  estado VARCHAR(50) NOT NULL,
  observaciones VARCHAR(2000),
  fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_asignaciones_fct_solicitud UNIQUE (solicitud_id)
);

CREATE INDEX idx_asignaciones_fct_alumno ON asignaciones_fct(alumno_id);
CREATE INDEX idx_asignaciones_fct_oferta ON asignaciones_fct(oferta_id);
CREATE INDEX idx_asignaciones_fct_empresa ON asignaciones_fct(empresa_id);
CREATE INDEX idx_asignaciones_fct_estado ON asignaciones_fct(estado);
