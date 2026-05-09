CREATE TABLE solicitudes_externas (
  id BIGSERIAL PRIMARY KEY,
  alumno_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  fuente VARCHAR(20) NOT NULL,
  id_externo VARCHAR(255) NOT NULL,
  titulo VARCHAR(500) NOT NULL,
  empresa_nombre VARCHAR(500),
  localidad VARCHAR(255),
  region VARCHAR(255),
  url_aplicacion VARCHAR(2000) NOT NULL,
  publicado_en TIMESTAMPTZ,
  categoria VARCHAR(255),
  estado VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_por BIGINT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  CONSTRAINT uk_solicitudes_externas_alumno_fuente UNIQUE (alumno_id, fuente, id_externo)
);

CREATE INDEX idx_solicitudes_externas_alumno ON solicitudes_externas(alumno_id);
CREATE INDEX idx_solicitudes_externas_estado ON solicitudes_externas(estado);

CREATE TABLE asignaciones_fct_externas (
  id BIGSERIAL PRIMARY KEY,
  solicitud_externa_id BIGINT NOT NULL REFERENCES solicitudes_externas(id) ON DELETE RESTRICT,
  alumno_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  estado VARCHAR(50) NOT NULL,
  observaciones VARCHAR(2000),
  fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_asignaciones_fct_externas_solicitud UNIQUE (solicitud_externa_id)
);

CREATE INDEX idx_asignaciones_fct_externas_alumno ON asignaciones_fct_externas(alumno_id);
CREATE INDEX idx_asignaciones_fct_externas_estado ON asignaciones_fct_externas(estado);
