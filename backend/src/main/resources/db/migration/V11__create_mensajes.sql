CREATE TABLE conversaciones (
  id BIGSERIAL PRIMARY KEY,
  titulo VARCHAR(180),
  participante_a_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  participante_b_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_conversaciones_participantes_distintos
    CHECK (participante_a_id <> participante_b_id)
);

CREATE TABLE mensajes (
  id BIGSERIAL PRIMARY KEY,
  conversacion_id BIGINT NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  remitente_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  contenido VARCHAR(2000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversaciones_participante_a ON conversaciones(participante_a_id);
CREATE INDEX idx_conversaciones_participante_b ON conversaciones(participante_b_id);
CREATE INDEX idx_conversaciones_updated_at ON conversaciones(updated_at DESC);
CREATE INDEX idx_mensajes_conversacion_created_at ON mensajes(conversacion_id, created_at, id);
