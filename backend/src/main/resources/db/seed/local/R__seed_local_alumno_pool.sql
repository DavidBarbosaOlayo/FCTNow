-- Pool of demo alumnos so tutor and coordinator views have a richer dataset.
-- All accounts share the same bcrypt hash as the original demo users.

INSERT INTO app_users (email, password_hash, display_name, enabled)
VALUES
  ('lucia.fernandez@example.com',  '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Lucia Fernandez Martin',  TRUE),
  ('pablo.sanchez@example.com',    '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Pablo Sanchez Ruiz',      TRUE),
  ('marta.gomez@example.com',      '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Marta Gomez Lopez',       TRUE),
  ('daniel.torres@example.com',    '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Daniel Torres Perez',     TRUE),
  ('sofia.navarro@example.com',    '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Sofia Navarro Vidal',     TRUE),
  ('hugo.ramirez@example.com',     '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Hugo Ramirez Cabrera',    TRUE),
  ('carla.ortega@example.com',     '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Carla Ortega Serrano',    TRUE),
  ('adrian.castillo@example.com',  '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Adrian Castillo Romero',  TRUE),
  ('ines.vargas@example.com',      '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Ines Vargas Dominguez',   TRUE),
  ('javier.molina@example.com',    '$2a$10$9ssoe.HD9QeqKkShCVorTONNHxV8uNIJKyOQVlvBtiN7FClz8mXDK', 'Javier Molina Cano',      TRUE)
ON CONFLICT (email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();

INSERT INTO user_roles (user_id, role)
SELECT u.id, 'ALUMNO'
FROM app_users u
WHERE u.email IN (
  'lucia.fernandez@example.com',
  'pablo.sanchez@example.com',
  'marta.gomez@example.com',
  'daniel.torres@example.com',
  'sofia.navarro@example.com',
  'hugo.ramirez@example.com',
  'carla.ortega@example.com',
  'adrian.castillo@example.com',
  'ines.vargas@example.com',
  'javier.molina@example.com'
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO alumno_preferencias (
  alumno_id,
  familia_profesional,
  ciclo_formativo,
  localidad_preferida,
  modalidad_preferida,
  fecha_disponibilidad,
  observaciones
)
SELECT
  u.id,
  seed.familia_profesional,
  seed.ciclo_formativo,
  seed.localidad_preferida,
  seed.modalidad_preferida,
  seed.fecha_disponibilidad,
  seed.observaciones
FROM (
  VALUES
    ('lucia.fernandez@example.com',  'Informatica y comunicaciones',                'Desarrollo de Aplicaciones Web',                       'Valencia',  'HIBRIDA',    DATE '2026-09-15', 'Frontend con Angular y React. Disponibilidad para proyectos reales.'),
    ('pablo.sanchez@example.com',    'Informatica y comunicaciones',                'Desarrollo de Aplicaciones Multiplataforma',           'Alicante',  'PRESENCIAL', DATE '2026-09-15', 'Backend con Java y Spring Boot. Buen nivel de SQL.'),
    ('marta.gomez@example.com',      'Informatica y comunicaciones',                'Sistemas Microinformaticos y Redes',                   'Castellon', 'PRESENCIAL', DATE '2026-09-20', 'Atencion al usuario, redes y mantenimiento de equipos.'),
    ('daniel.torres@example.com',    'Administracion y gestion',                    'Administracion y Finanzas',                            'Valencia',  'PRESENCIAL', DATE '2026-09-22', 'Contabilidad, nominas y Excel avanzado. Ingles B2.'),
    ('sofia.navarro@example.com',    'Comercio y marketing',                        'Marketing y Publicidad',                               'Gandia',    'HIBRIDA',    DATE '2026-09-15', 'Redes sociales, copywriting y diseno grafico basico.'),
    ('hugo.ramirez@example.com',     'Sanidad',                                     'Cuidados Auxiliares de Enfermeria',                    'Alicante',  'PRESENCIAL', DATE '2026-09-15', 'Practicas previas en residencias y centros de dia.'),
    ('carla.ortega@example.com',     'Servicios socioculturales y a la comunidad',  'Educacion Infantil',                                   'Valencia',  'PRESENCIAL', DATE '2026-09-12', 'Experiencia como monitora de comedor y campamentos.'),
    ('adrian.castillo@example.com',  'Comercio y marketing',                        'Comercio Internacional',                               'Sagunto',   'HIBRIDA',    DATE '2026-09-25', 'Frances B2 y nivel medio de chino mandarin.'),
    ('ines.vargas@example.com',      'Servicios socioculturales y a la comunidad',  'Integracion Social',                                   'Elche',     'PRESENCIAL', DATE '2026-09-15', 'Voluntariado en asociaciones de barrio y mediacion.'),
    ('javier.molina@example.com',    'Electricidad y electronica',                  'Sistemas Electrotecnicos y Automatizados',             'Castellon', 'PRESENCIAL', DATE '2026-09-20', 'Carnet B y disponibilidad para desplazamientos en provincia.')
) AS seed(
  email,
  familia_profesional,
  ciclo_formativo,
  localidad_preferida,
  modalidad_preferida,
  fecha_disponibilidad,
  observaciones
)
JOIN app_users u ON u.email = seed.email
ON CONFLICT (alumno_id) DO UPDATE SET
  familia_profesional  = EXCLUDED.familia_profesional,
  ciclo_formativo      = EXCLUDED.ciclo_formativo,
  localidad_preferida  = EXCLUDED.localidad_preferida,
  modalidad_preferida  = EXCLUDED.modalidad_preferida,
  fecha_disponibilidad = EXCLUDED.fecha_disponibilidad,
  observaciones        = EXCLUDED.observaciones,
  updated_at           = NOW();
