ALTER TABLE notificaciones
  ADD COLUMN destinatario_id BIGINT REFERENCES app_users(id) ON DELETE CASCADE;

UPDATE notificaciones
SET destinatario_id = alumno_id
WHERE destinatario_id IS NULL;

ALTER TABLE notificaciones
  ALTER COLUMN destinatario_id SET NOT NULL;

ALTER TABLE notificaciones
  ALTER COLUMN alumno_id DROP NOT NULL;

CREATE INDEX idx_notificaciones_destinatario_created
  ON notificaciones(destinatario_id, created_at DESC);

CREATE INDEX idx_notificaciones_destinatario_leida
  ON notificaciones(destinatario_id, leida);
