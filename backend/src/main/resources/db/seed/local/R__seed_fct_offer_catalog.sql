INSERT INTO app_users (
  email,
  password_hash,
  display_name,
  enabled
) VALUES
  (
    'alumno@example.com',
    '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK',
    'Alumno Demo',
    TRUE
  ),
  (
    'empresa@example.com',
    '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK',
    'Empresa Demo',
    TRUE
  ),
  (
    'tutor@example.com',
    '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK',
    'Tutor Centro Demo',
    TRUE
  ),
  (
    'coordinador@example.com',
    '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK',
    'Coordinador Demo',
    TRUE
  )
ON CONFLICT (email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();

INSERT INTO user_roles (user_id, role)
SELECT id, 'ALUMNO'
FROM app_users
WHERE email = 'alumno@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'EMPRESA'
FROM app_users
WHERE email = 'empresa@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'TUTOR_CENTRO'
FROM app_users
WHERE email = 'tutor@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'COORDINADOR'
FROM app_users
WHERE email = 'coordinador@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO empresas (
  nombre,
  tipo_identificador_fiscal,
  identificador_fiscal,
  sector,
  descripcion,
  direccion,
  localidad,
  provincia,
  codigo_postal,
  email_contacto,
  telefono_contacto,
  persona_contacto,
  estado
) VALUES
  (
    'Tech Norte Formacion',
    'CIF',
    'B12345678',
    'Desarrollo de software',
    'Empresa colaboradora especializada en aplicaciones web y servicios internos.',
    'Calle Mayor 12',
    'Valencia',
    'Valencia',
    '46001',
    'fct@technorte.example',
    '960000000',
    'Laura Garcia',
    'ACTIVA'
  ),
  (
    'Clinica Mediterraneo',
    'CIF',
    'B87654321',
    'Sanidad',
    'Centro sanitario colaborador con plazas de apoyo administrativo y atencion al paciente.',
    'Avenida del Puerto 44',
    'Alicante',
    'Alicante',
    '03001',
    'practicas@clinicamed.example',
    '965000000',
    'Marta Ruiz',
    'ACTIVA'
  ),
  (
    'Logistica Levante',
    'CIF',
    'B11223344',
    'Logistica',
    'Operador logistico con actividad en almacen, transporte y gestion de inventario.',
    'Poligono Sur 8',
    'Castellon',
    'Castellon',
    '12006',
    'rrhh@logisticalevante.example',
    '964000000',
    'Carlos Vidal',
    'ACTIVA'
  )
ON CONFLICT (identificador_fiscal) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  sector = EXCLUDED.sector,
  descripcion = EXCLUDED.descripcion,
  direccion = EXCLUDED.direccion,
  localidad = EXCLUDED.localidad,
  provincia = EXCLUDED.provincia,
  codigo_postal = EXCLUDED.codigo_postal,
  email_contacto = EXCLUDED.email_contacto,
  telefono_contacto = EXCLUDED.telefono_contacto,
  persona_contacto = EXCLUDED.persona_contacto,
  estado = EXCLUDED.estado,
  updated_at = NOW();

INSERT INTO ofertas_fct (
  empresa_id,
  titulo,
  descripcion,
  familia_profesional,
  ciclo_formativo,
  localidad,
  provincia,
  modalidad,
  fecha_inicio,
  fecha_fin,
  plazas,
  requisitos,
  tareas,
  estado
)
SELECT
  e.id,
  seed.titulo,
  seed.descripcion,
  seed.familia_profesional,
  seed.ciclo_formativo,
  seed.localidad,
  seed.provincia,
  seed.modalidad,
  seed.fecha_inicio,
  seed.fecha_fin,
  seed.plazas,
  seed.requisitos,
  seed.tareas,
  seed.estado
FROM (
  VALUES
    (
      'B12345678',
      'Practicas de desarrollo web',
      'Apoyo al equipo de desarrollo en mantenimiento de aplicaciones internas.',
      'Informatica y comunicaciones',
      'Desarrollo de Aplicaciones Web',
      'Valencia',
      'Valencia',
      'PRESENCIAL',
      DATE '2026-09-15',
      DATE '2026-12-15',
      2,
      'Conocimientos basicos de HTML, CSS, TypeScript y Git.',
      'Maquetacion, pruebas funcionales, soporte a incidencias y documentacion tecnica.',
      'PUBLICADA'
    ),
    (
      'B12345678',
      'Soporte de sistemas y redes',
      'Colaboracion con el area tecnica para preparar equipos y resolver incidencias.',
      'Informatica y comunicaciones',
      'Sistemas Microinformaticos y Redes',
      'Valencia',
      'Valencia',
      'HIBRIDA',
      DATE '2026-10-01',
      DATE '2027-01-20',
      1,
      'Interes por soporte tecnico, redes y documentacion de incidencias.',
      'Preparacion de equipos, seguimiento de tickets y soporte a usuarios internos.',
      'PUBLICADA'
    ),
    (
      'B87654321',
      'Apoyo administrativo sanitario',
      'Practicas en gestion documental, atencion telefonica y apoyo administrativo.',
      'Administracion y gestion',
      'Gestion Administrativa',
      'Alicante',
      'Alicante',
      'PRESENCIAL',
      DATE '2026-09-20',
      DATE '2026-12-20',
      3,
      'Organizacion, trato correcto con usuarios y manejo basico de herramientas ofimaticas.',
      'Registro de documentacion, archivo, apoyo en citas y atencion inicial.',
      'PUBLICADA'
    ),
    (
      'B11223344',
      'Gestion de almacen e inventario',
      'Participacion en tareas de almacen, recepcion de mercancias y control de stock.',
      'Comercio y marketing',
      'Actividades Comerciales',
      'Castellon',
      'Castellon',
      'PRESENCIAL',
      DATE '2026-09-25',
      DATE '2026-12-18',
      2,
      'Interes por operaciones, orden y uso basico de hojas de calculo.',
      'Control de inventario, preparacion de pedidos y apoyo en documentacion logistica.',
      'PUBLICADA'
    ),
    (
      'B11223344',
      'Oferta interna pendiente de revision',
      'Oferta de ejemplo no visible en el catalogo publico.',
      'Comercio y marketing',
      'Actividades Comerciales',
      'Castellon',
      'Castellon',
      'PRESENCIAL',
      DATE '2026-11-01',
      DATE '2027-02-01',
      1,
      'Pendiente de revisar.',
      'Pendiente de validar por el centro.',
      'BORRADOR'
    )
) AS seed(
  identificador_fiscal,
  titulo,
  descripcion,
  familia_profesional,
  ciclo_formativo,
  localidad,
  provincia,
  modalidad,
  fecha_inicio,
  fecha_fin,
  plazas,
  requisitos,
  tareas,
  estado
)
JOIN empresas e ON e.identificador_fiscal = seed.identificador_fiscal
WHERE NOT EXISTS (
  SELECT 1
  FROM ofertas_fct existing
  WHERE existing.empresa_id = e.id
    AND existing.titulo = seed.titulo
);

UPDATE app_users
   SET empresa_id = (SELECT id FROM empresas WHERE identificador_fiscal = 'B12345678'),
       updated_at = NOW()
 WHERE email = 'empresa@example.com'
   AND (
     empresa_id IS NULL
     OR empresa_id <> (SELECT id FROM empresas WHERE identificador_fiscal = 'B12345678')
   );
