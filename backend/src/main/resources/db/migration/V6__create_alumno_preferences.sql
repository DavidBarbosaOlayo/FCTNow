CREATE TABLE alumno_preferencias (
  id BIGSERIAL PRIMARY KEY,
  alumno_id BIGINT NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  familia_profesional VARCHAR(150),
  ciclo_formativo VARCHAR(150),
  localidad_preferida VARCHAR(150),
  modalidad_preferida VARCHAR(50),
  fecha_disponibilidad DATE,
  observaciones VARCHAR(1000),
  cv_file_name VARCHAR(255),
  cv_content_type VARCHAR(100),
  cv_size BIGINT,
  cv_content BYTEA,
  cv_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alumno_preferencias_alumno ON alumno_preferencias(alumno_id);
