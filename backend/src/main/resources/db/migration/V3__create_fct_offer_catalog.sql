CREATE TABLE empresas (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  tipo_identificador_fiscal VARCHAR(20) NOT NULL,
  identificador_fiscal VARCHAR(20) NOT NULL UNIQUE,
  sector VARCHAR(100) NOT NULL,
  descripcion VARCHAR(1000),
  direccion VARCHAR(200) NOT NULL,
  localidad VARCHAR(100) NOT NULL,
  provincia VARCHAR(100) NOT NULL,
  codigo_postal VARCHAR(5) NOT NULL,
  email_contacto VARCHAR(254) NOT NULL,
  telefono_contacto VARCHAR(30),
  persona_contacto VARCHAR(150) NOT NULL,
  estado VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ofertas_fct (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id),
  titulo VARCHAR(150) NOT NULL,
  descripcion VARCHAR(2000) NOT NULL,
  familia_profesional VARCHAR(150) NOT NULL,
  ciclo_formativo VARCHAR(150),
  localidad VARCHAR(100) NOT NULL,
  provincia VARCHAR(100) NOT NULL,
  modalidad VARCHAR(20) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  plazas INTEGER NOT NULL,
  requisitos VARCHAR(2000),
  tareas VARCHAR(2000) NOT NULL,
  estado VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_empresas_estado ON empresas(estado);
CREATE INDEX idx_ofertas_fct_estado ON ofertas_fct(estado);
CREATE INDEX idx_ofertas_fct_familia ON ofertas_fct(familia_profesional);
CREATE INDEX idx_ofertas_fct_localidad ON ofertas_fct(localidad);
CREATE INDEX idx_ofertas_fct_modalidad ON ofertas_fct(modalidad);
