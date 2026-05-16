import { AsignacionEstado } from '../asignaciones/asignaciones.models';

export type TutorAlumnoPreferencias = {
  familiaProfesional: string | null;
  cicloFormativo: string | null;
  localidad: string | null;
  modalidad: string | null;
  fechaDisponibilidad: string | null;
  observaciones: string | null;
};

export type TutorAlumnoSolicitudes = {
  total: number;
  solicitadas: number;
  aceptadas: number;
  rechazadas: number;
};

export type TutorAlumnoAsignacion = {
  id: number;
  estado: AsignacionEstado;
  fechaAsignacion: string;
  oferta: string;
  empresa: string;
  observaciones: string | null;
};

export type TutorAlumnoAsignacionPendiente = {
  tipo: 'INTERNA' | 'EXTERNA';
  solicitudId: number;
  aceptadaEn: string;
  oferta: string;
  empresa: string;
  localidad: string | null;
  urlAplicacion: string | null;
};

export type TutorAlumno = {
  id: number;
  email: string;
  centroEmail: string | null;
  displayName: string;
  enabled: boolean;
  photoDataUrl: string | null;
  hasCv: boolean;
  cvFileName: string | null;
  cvContentType: string | null;
  cvSize: number | null;
  cvUpdatedAt: string | null;
  preferencias: TutorAlumnoPreferencias | null;
  solicitudes: TutorAlumnoSolicitudes;
  asignacionActual: TutorAlumnoAsignacion | null;
  asignacionPendiente: TutorAlumnoAsignacionPendiente | null;
};

export type TutorAlumnoCreateRequest = {
  displayName: string;
  username: string;
  password: string;
  centroEmail: string;
};

export type TutorAlumnoImportRow = {
  fila: number;
  email: string | null;
  displayName: string | null;
  estado: 'CREADO' | 'OMITIDO' | 'ERROR';
  mensaje: string;
};

export type TutorAlumnoImportResult = {
  creados: number;
  omitidos: number;
  errores: number;
  filas: TutorAlumnoImportRow[];
};
