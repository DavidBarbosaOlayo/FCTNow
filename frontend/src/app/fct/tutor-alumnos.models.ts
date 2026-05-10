import { AsignacionEstado } from '../asignaciones/asignaciones.models';

export type TutorAlumnoPreferencias = {
  familiaProfesional: string | null;
  cicloFormativo: string | null;
  localidad: string | null;
  modalidad: string | null;
  fechaDisponibilidad: string | null;
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

export type TutorAlumno = {
  id: number;
  email: string;
  displayName: string;
  enabled: boolean;
  preferencias: TutorAlumnoPreferencias | null;
  solicitudes: TutorAlumnoSolicitudes;
  asignacionActual: TutorAlumnoAsignacion | null;
};
