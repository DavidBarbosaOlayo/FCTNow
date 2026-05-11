import { OfertaModalidad } from '../practicas/ofertas.models';

export type AlumnoPreferencias = {
  familiaProfesional: string | null;
  cicloFormativo: string | null;
  localidadPreferida: string | null;
  modalidadPreferida: OfertaModalidad | null;
  fechaDisponibilidad: string | null;
  observaciones: string | null;
  hasCv: boolean;
  cvFileName: string | null;
  cvContentType: string | null;
  cvSize: number | null;
  cvUpdatedAt: string | null;
  hasPhoto: boolean;
  photoDataUrl: string | null;
  photoContentType: string | null;
  photoSize: number | null;
  photoUpdatedAt: string | null;
};

export type AlumnoPreferenciasRequest = {
  familiaProfesional: string | null;
  cicloFormativo: string | null;
  localidadPreferida: string | null;
  modalidadPreferida: OfertaModalidad | null;
  fechaDisponibilidad: string | null;
  observaciones: string | null;
};
