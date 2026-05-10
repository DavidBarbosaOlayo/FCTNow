CREATE TABLE notificaciones (
  id BIGSERIAL PRIMARY KEY,
  alumno_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  recomendada_por BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(500) NOT NULL,
  mensaje VARCHAR(2000),
  action_url VARCHAR(2000),
  action_label VARCHAR(150),
  oferta_id BIGINT REFERENCES ofertas_fct(id) ON DELETE SET NULL,
  oferta_externa_titulo VARCHAR(500),
  oferta_externa_empresa VARCHAR(500),
  oferta_externa_url VARCHAR(2000),
  oferta_externa_localidad VARCHAR(255),
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_alumno_created ON notificaciones(alumno_id, created_at DESC);
CREATE INDEX idx_notificaciones_alumno_leida ON notificaciones(alumno_id, leida);
