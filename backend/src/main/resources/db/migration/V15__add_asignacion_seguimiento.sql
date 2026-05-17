ALTER TABLE asignaciones_fct
  ADD COLUMN horas_totales INT NOT NULL DEFAULT 400,
  ADD COLUMN fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN horas_diarias_estimadas INT NOT NULL DEFAULT 7,
  ADD COLUMN remunerada BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN importe_mensual NUMERIC(10, 2),
  ADD COLUMN observaciones_retribucion VARCHAR(2000);

ALTER TABLE asignaciones_fct
  ALTER COLUMN horas_totales DROP DEFAULT,
  ALTER COLUMN fecha_inicio DROP DEFAULT,
  ALTER COLUMN horas_diarias_estimadas DROP DEFAULT,
  ALTER COLUMN remunerada DROP DEFAULT;

ALTER TABLE asignaciones_fct
  ADD CONSTRAINT ck_asignaciones_fct_horas_totales CHECK (horas_totales BETWEEN 40 AND 1000),
  ADD CONSTRAINT ck_asignaciones_fct_horas_diarias CHECK (horas_diarias_estimadas BETWEEN 1 AND 12),
  ADD CONSTRAINT ck_asignaciones_fct_importe_remunerada
    CHECK (importe_mensual IS NULL OR remunerada = TRUE);

ALTER TABLE asignaciones_fct_externas
  ADD COLUMN horas_totales INT NOT NULL DEFAULT 400,
  ADD COLUMN fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN horas_diarias_estimadas INT NOT NULL DEFAULT 7,
  ADD COLUMN remunerada BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN importe_mensual NUMERIC(10, 2),
  ADD COLUMN observaciones_retribucion VARCHAR(2000);

ALTER TABLE asignaciones_fct_externas
  ALTER COLUMN horas_totales DROP DEFAULT,
  ALTER COLUMN fecha_inicio DROP DEFAULT,
  ALTER COLUMN horas_diarias_estimadas DROP DEFAULT,
  ALTER COLUMN remunerada DROP DEFAULT;

ALTER TABLE asignaciones_fct_externas
  ADD CONSTRAINT ck_asignaciones_fct_ext_horas_totales CHECK (horas_totales BETWEEN 40 AND 1000),
  ADD CONSTRAINT ck_asignaciones_fct_ext_horas_diarias CHECK (horas_diarias_estimadas BETWEEN 1 AND 12),
  ADD CONSTRAINT ck_asignaciones_fct_ext_importe_remunerada
    CHECK (importe_mensual IS NULL OR remunerada = TRUE);
