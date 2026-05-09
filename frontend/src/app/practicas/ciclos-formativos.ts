export type GradoFp = 'GRADO_MEDIO' | 'GRADO_SUPERIOR';

export type CicloFormativoOption = {
  value: string;
  label: string;
  grado: GradoFp;
};

export const GRADO_LABELS: Record<GradoFp, string> = {
  GRADO_MEDIO: 'Grado Medio',
  GRADO_SUPERIOR: 'Grado Superior',
};

export const CICLOS_POR_FAMILIA: Record<string, CicloFormativoOption[]> = {
  'Informática y comunicaciones': [
    { value: 'Sistemas Microinformáticos y Redes', label: 'Sistemas Microinformáticos y Redes', grado: 'GRADO_MEDIO' },
    { value: 'Administración de Sistemas Informáticos en Red', label: 'Administración de Sistemas Informáticos en Red', grado: 'GRADO_SUPERIOR' },
    { value: 'Desarrollo de Aplicaciones Multiplataforma', label: 'Desarrollo de Aplicaciones Multiplataforma', grado: 'GRADO_SUPERIOR' },
    { value: 'Desarrollo de Aplicaciones Web', label: 'Desarrollo de Aplicaciones Web', grado: 'GRADO_SUPERIOR' },
  ],
  'Administración y gestión': [
    { value: 'Gestión Administrativa', label: 'Gestión Administrativa', grado: 'GRADO_MEDIO' },
    { value: 'Administración y Finanzas', label: 'Administración y Finanzas', grado: 'GRADO_SUPERIOR' },
    { value: 'Asistencia a la Dirección', label: 'Asistencia a la Dirección', grado: 'GRADO_SUPERIOR' },
  ],
  'Comercio y marketing': [
    { value: 'Actividades Comerciales', label: 'Actividades Comerciales', grado: 'GRADO_MEDIO' },
    { value: 'Comercio Internacional', label: 'Comercio Internacional', grado: 'GRADO_SUPERIOR' },
    { value: 'Gestión de Ventas y Espacios Comerciales', label: 'Gestión de Ventas y Espacios Comerciales', grado: 'GRADO_SUPERIOR' },
    { value: 'Marketing y Publicidad', label: 'Marketing y Publicidad', grado: 'GRADO_SUPERIOR' },
    { value: 'Transporte y Logística', label: 'Transporte y Logística', grado: 'GRADO_SUPERIOR' },
  ],
  'Sanidad': [
    { value: 'Cuidados Auxiliares de Enfermería', label: 'Cuidados Auxiliares de Enfermería', grado: 'GRADO_MEDIO' },
    { value: 'Emergencias Sanitarias', label: 'Emergencias Sanitarias', grado: 'GRADO_MEDIO' },
    { value: 'Farmacia y Parafarmacia', label: 'Farmacia y Parafarmacia', grado: 'GRADO_MEDIO' },
    { value: 'Anatomía Patológica y Citodiagnóstico', label: 'Anatomía Patológica y Citodiagnóstico', grado: 'GRADO_SUPERIOR' },
    { value: 'Audiología Protésica', label: 'Audiología Protésica', grado: 'GRADO_SUPERIOR' },
    { value: 'Dietética', label: 'Dietética', grado: 'GRADO_SUPERIOR' },
    { value: 'Documentación y Administración Sanitarias', label: 'Documentación y Administración Sanitarias', grado: 'GRADO_SUPERIOR' },
    { value: 'Higiene Bucodental', label: 'Higiene Bucodental', grado: 'GRADO_SUPERIOR' },
    { value: 'Imagen para el Diagnóstico y Medicina Nuclear', label: 'Imagen para el Diagnóstico y Medicina Nuclear', grado: 'GRADO_SUPERIOR' },
    { value: 'Laboratorio Clínico y Biomédico', label: 'Laboratorio Clínico y Biomédico', grado: 'GRADO_SUPERIOR' },
    { value: 'Ortoprótesis y Productos de Apoyo', label: 'Ortoprótesis y Productos de Apoyo', grado: 'GRADO_SUPERIOR' },
    { value: 'Prótesis Dentales', label: 'Prótesis Dentales', grado: 'GRADO_SUPERIOR' },
    { value: 'Radioterapia y Dosimetría', label: 'Radioterapia y Dosimetría', grado: 'GRADO_SUPERIOR' },
    { value: 'Salud Ambiental', label: 'Salud Ambiental', grado: 'GRADO_SUPERIOR' },
  ],
  'Hostelería y turismo': [
    { value: 'Cocina y Gastronomía', label: 'Cocina y Gastronomía', grado: 'GRADO_MEDIO' },
    { value: 'Servicios en Restauración', label: 'Servicios en Restauración', grado: 'GRADO_MEDIO' },
    { value: 'Agencias de Viajes y Gestión de Eventos', label: 'Agencias de Viajes y Gestión de Eventos', grado: 'GRADO_SUPERIOR' },
    { value: 'Dirección de Cocina', label: 'Dirección de Cocina', grado: 'GRADO_SUPERIOR' },
    { value: 'Dirección de Servicios de Restauración', label: 'Dirección de Servicios de Restauración', grado: 'GRADO_SUPERIOR' },
    { value: 'Gestión de Alojamientos Turísticos', label: 'Gestión de Alojamientos Turísticos', grado: 'GRADO_SUPERIOR' },
    { value: 'Guía, Información y Asistencias Turísticas', label: 'Guía, Información y Asistencias Turísticas', grado: 'GRADO_SUPERIOR' },
  ],
  'Servicios socioculturales y a la comunidad': [
    { value: 'Atención a Personas en Situación de Dependencia', label: 'Atención a Personas en Situación de Dependencia', grado: 'GRADO_MEDIO' },
    { value: 'Animación Sociocultural y Turística', label: 'Animación Sociocultural y Turística', grado: 'GRADO_SUPERIOR' },
    { value: 'Educación Infantil', label: 'Educación Infantil', grado: 'GRADO_SUPERIOR' },
    { value: 'Integración Social', label: 'Integración Social', grado: 'GRADO_SUPERIOR' },
    { value: 'Mediación Comunicativa', label: 'Mediación Comunicativa', grado: 'GRADO_SUPERIOR' },
    { value: 'Promoción de Igualdad de Género', label: 'Promoción de Igualdad de Género', grado: 'GRADO_SUPERIOR' },
  ],
  'Imagen y sonido': [
    { value: 'Vídeo Disc-Jockey y Sonido', label: 'Vídeo Disc-Jockey y Sonido', grado: 'GRADO_MEDIO' },
    { value: 'Animaciones 3D, Juegos y Entornos Interactivos', label: 'Animaciones 3D, Juegos y Entornos Interactivos', grado: 'GRADO_SUPERIOR' },
    { value: 'Iluminación, Captación y Tratamiento de Imagen', label: 'Iluminación, Captación y Tratamiento de Imagen', grado: 'GRADO_SUPERIOR' },
    { value: 'Producción de Audiovisuales y Espectáculos', label: 'Producción de Audiovisuales y Espectáculos', grado: 'GRADO_SUPERIOR' },
    { value: 'Realización de Proyectos de Audiovisuales y Espectáculos', label: 'Realización de Proyectos de Audiovisuales y Espectáculos', grado: 'GRADO_SUPERIOR' },
    { value: 'Sonido para Audiovisuales y Espectáculos', label: 'Sonido para Audiovisuales y Espectáculos', grado: 'GRADO_SUPERIOR' },
  ],
  'Edificación y obra civil': [
    { value: 'Construcción', label: 'Construcción', grado: 'GRADO_MEDIO' },
    { value: 'Obras de Interior, Decoración y Rehabilitación', label: 'Obras de Interior, Decoración y Rehabilitación', grado: 'GRADO_MEDIO' },
    { value: 'Organización y Control de Obras de Construcción', label: 'Organización y Control de Obras de Construcción', grado: 'GRADO_SUPERIOR' },
    { value: 'Proyectos de Edificación', label: 'Proyectos de Edificación', grado: 'GRADO_SUPERIOR' },
    { value: 'Proyectos de Obra Civil', label: 'Proyectos de Obra Civil', grado: 'GRADO_SUPERIOR' },
  ],
  'Electricidad y electrónica': [
    { value: 'Instalaciones de Telecomunicaciones', label: 'Instalaciones de Telecomunicaciones', grado: 'GRADO_MEDIO' },
    { value: 'Instalaciones Eléctricas y Automáticas', label: 'Instalaciones Eléctricas y Automáticas', grado: 'GRADO_MEDIO' },
    { value: 'Automatización y Robótica Industrial', label: 'Automatización y Robótica Industrial', grado: 'GRADO_SUPERIOR' },
    { value: 'Mantenimiento Electrónico', label: 'Mantenimiento Electrónico', grado: 'GRADO_SUPERIOR' },
    { value: 'Sistemas de Telecomunicaciones e Informáticos', label: 'Sistemas de Telecomunicaciones e Informáticos', grado: 'GRADO_SUPERIOR' },
    { value: 'Sistemas Electrotécnicos y Automatizados', label: 'Sistemas Electrotécnicos y Automatizados', grado: 'GRADO_SUPERIOR' },
  ],
  'Energía y agua': [
    { value: 'Redes y Estaciones de Tratamiento de Aguas', label: 'Redes y Estaciones de Tratamiento de Aguas', grado: 'GRADO_MEDIO' },
    { value: 'Centrales Eléctricas', label: 'Centrales Eléctricas', grado: 'GRADO_SUPERIOR' },
    { value: 'Eficiencia Energética y Energía Solar Térmica', label: 'Eficiencia Energética y Energía Solar Térmica', grado: 'GRADO_SUPERIOR' },
    { value: 'Energías Renovables', label: 'Energías Renovables', grado: 'GRADO_SUPERIOR' },
    { value: 'Gestión del Agua', label: 'Gestión del Agua', grado: 'GRADO_SUPERIOR' },
  ],
  'Fabricación mecánica': [
    { value: 'Conformado por Moldeo de Metales y Polímeros', label: 'Conformado por Moldeo de Metales y Polímeros', grado: 'GRADO_MEDIO' },
    { value: 'Mecanizado', label: 'Mecanizado', grado: 'GRADO_MEDIO' },
    { value: 'Soldadura y Calderería', label: 'Soldadura y Calderería', grado: 'GRADO_MEDIO' },
    { value: 'Construcciones Metálicas', label: 'Construcciones Metálicas', grado: 'GRADO_SUPERIOR' },
    { value: 'Diseño en Fabricación Mecánica', label: 'Diseño en Fabricación Mecánica', grado: 'GRADO_SUPERIOR' },
    { value: 'Programación de la Producción en Fabricación Mecánica', label: 'Programación de la Producción en Fabricación Mecánica', grado: 'GRADO_SUPERIOR' },
    { value: 'Programación de la Producción en Moldeo de Metales y Polímeros', label: 'Programación de la Producción en Moldeo de Metales y Polímeros', grado: 'GRADO_SUPERIOR' },
  ],
  'Industrias alimentarias': [
    { value: 'Aceites de Oliva y Vinos', label: 'Aceites de Oliva y Vinos', grado: 'GRADO_MEDIO' },
    { value: 'Elaboración de Productos Alimenticios', label: 'Elaboración de Productos Alimenticios', grado: 'GRADO_MEDIO' },
    { value: 'Panadería, Repostería y Confitería', label: 'Panadería, Repostería y Confitería', grado: 'GRADO_MEDIO' },
    { value: 'Procesos y Calidad en la Industria Alimentaria', label: 'Procesos y Calidad en la Industria Alimentaria', grado: 'GRADO_SUPERIOR' },
    { value: 'Vitivinicultura', label: 'Vitivinicultura', grado: 'GRADO_SUPERIOR' },
  ],
  'Instalación y mantenimiento': [
    { value: 'Instalaciones de Producción de Calor', label: 'Instalaciones de Producción de Calor', grado: 'GRADO_MEDIO' },
    { value: 'Instalaciones Frigoríficas y de Climatización', label: 'Instalaciones Frigoríficas y de Climatización', grado: 'GRADO_MEDIO' },
    { value: 'Mantenimiento Electromecánico', label: 'Mantenimiento Electromecánico', grado: 'GRADO_MEDIO' },
    { value: 'Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos', label: 'Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos', grado: 'GRADO_SUPERIOR' },
    { value: 'Mantenimiento de Instalaciones Térmicas y de Fluidos', label: 'Mantenimiento de Instalaciones Térmicas y de Fluidos', grado: 'GRADO_SUPERIOR' },
    { value: 'Mecatrónica Industrial', label: 'Mecatrónica Industrial', grado: 'GRADO_SUPERIOR' },
    { value: 'Prevención de Riesgos Profesionales', label: 'Prevención de Riesgos Profesionales', grado: 'GRADO_SUPERIOR' },
  ],
  'Química': [
    { value: 'Operaciones de Laboratorio', label: 'Operaciones de Laboratorio', grado: 'GRADO_MEDIO' },
    { value: 'Planta Química', label: 'Planta Química', grado: 'GRADO_MEDIO' },
    { value: 'Fabricación de Productos Farmacéuticos, Biotecnológicos y Afines', label: 'Fabricación de Productos Farmacéuticos, Biotecnológicos y Afines', grado: 'GRADO_SUPERIOR' },
    { value: 'Laboratorio de Análisis y Control de Calidad', label: 'Laboratorio de Análisis y Control de Calidad', grado: 'GRADO_SUPERIOR' },
    { value: 'Química Industrial', label: 'Química Industrial', grado: 'GRADO_SUPERIOR' },
    { value: 'Química y Salud Ambiental', label: 'Química y Salud Ambiental', grado: 'GRADO_SUPERIOR' },
  ],
  'Transporte y mantenimiento de vehículos': [
    { value: 'Carrocería', label: 'Carrocería', grado: 'GRADO_MEDIO' },
    { value: 'Conducción de Vehículos de Transporte por Carretera', label: 'Conducción de Vehículos de Transporte por Carretera', grado: 'GRADO_MEDIO' },
    { value: 'Electromecánica de Maquinaria', label: 'Electromecánica de Maquinaria', grado: 'GRADO_MEDIO' },
    { value: 'Electromecánica de Vehículos Automóviles', label: 'Electromecánica de Vehículos Automóviles', grado: 'GRADO_MEDIO' },
    { value: 'Mantenimiento de Material Rodante Ferroviario', label: 'Mantenimiento de Material Rodante Ferroviario', grado: 'GRADO_MEDIO' },
    { value: 'Automoción', label: 'Automoción', grado: 'GRADO_SUPERIOR' },
    { value: 'Mantenimiento Aeromecánico de Aviones con Motor de Pistón', label: 'Mantenimiento Aeromecánico de Aviones con Motor de Pistón', grado: 'GRADO_SUPERIOR' },
    { value: 'Mantenimiento Aeromecánico de Aviones con Motor de Turbina', label: 'Mantenimiento Aeromecánico de Aviones con Motor de Turbina', grado: 'GRADO_SUPERIOR' },
    { value: 'Mantenimiento Aeromecánico de Helicópteros con Motor de Pistón', label: 'Mantenimiento Aeromecánico de Helicópteros con Motor de Pistón', grado: 'GRADO_SUPERIOR' },
    { value: 'Mantenimiento Aeromecánico de Helicópteros con Motor de Turbina', label: 'Mantenimiento Aeromecánico de Helicópteros con Motor de Turbina', grado: 'GRADO_SUPERIOR' },
    { value: 'Mantenimiento de Aviónica', label: 'Mantenimiento de Aviónica', grado: 'GRADO_SUPERIOR' },
  ],
  'Actividades físicas y deportivas': [
    { value: 'Guía en el Medio Natural y de Tiempo Libre', label: 'Guía en el Medio Natural y de Tiempo Libre', grado: 'GRADO_MEDIO' },
    { value: 'Acondicionamiento Físico', label: 'Acondicionamiento Físico', grado: 'GRADO_SUPERIOR' },
    { value: 'Enseñanza y Animación Sociodeportiva', label: 'Enseñanza y Animación Sociodeportiva', grado: 'GRADO_SUPERIOR' },
  ],
  'Agraria': [
    { value: 'Aprovechamiento y Conservación del Medio Natural', label: 'Aprovechamiento y Conservación del Medio Natural', grado: 'GRADO_MEDIO' },
    { value: 'Jardinería y Floristería', label: 'Jardinería y Floristería', grado: 'GRADO_MEDIO' },
    { value: 'Producción Agroecológica', label: 'Producción Agroecológica', grado: 'GRADO_MEDIO' },
    { value: 'Producción Agropecuaria', label: 'Producción Agropecuaria', grado: 'GRADO_MEDIO' },
    { value: 'Ganadería y Asistencia en Sanidad Animal', label: 'Ganadería y Asistencia en Sanidad Animal', grado: 'GRADO_SUPERIOR' },
    { value: 'Gestión Forestal y del Medio Natural', label: 'Gestión Forestal y del Medio Natural', grado: 'GRADO_SUPERIOR' },
    { value: 'Paisajismo y Medio Rural', label: 'Paisajismo y Medio Rural', grado: 'GRADO_SUPERIOR' },
  ],
  'Artes gráficas': [
    { value: 'Impresión Gráfica', label: 'Impresión Gráfica', grado: 'GRADO_MEDIO' },
    { value: 'Postimpresión y Acabados Gráficos', label: 'Postimpresión y Acabados Gráficos', grado: 'GRADO_MEDIO' },
    { value: 'Preimpresión Digital', label: 'Preimpresión Digital', grado: 'GRADO_MEDIO' },
    { value: 'Diseño y Edición de Publicaciones Impresas y Multimedia', label: 'Diseño y Edición de Publicaciones Impresas y Multimedia', grado: 'GRADO_SUPERIOR' },
    { value: 'Diseño y Gestión de la Producción Gráfica', label: 'Diseño y Gestión de la Producción Gráfica', grado: 'GRADO_SUPERIOR' },
  ],
};

export function getCiclosByFamilia(familia: string | null | undefined): CicloFormativoOption[] {
  if (!familia) {
    return [];
  }
  return CICLOS_POR_FAMILIA[familia] ?? [];
}
