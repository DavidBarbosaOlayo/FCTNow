import { AsignacionEstado, AsignacionSeguimiento } from './asignaciones.models';
import { SolicitudExternaFuente } from '../practicas/solicitudes-externas.models';

export type AsignacionFctExterna = {
  id: number;
  solicitudExternaId: number;
  alumnoId: number;
  alumnoNombre: string;
  fuente: SolicitudExternaFuente;
  idExterno: string;
  titulo: string;
  empresaNombre: string | null;
  localidad: string | null;
  region: string | null;
  urlAplicacion: string;
  estado: AsignacionEstado;
  observaciones: string | null;
  fechaAsignacion: string;
  seguimiento?: AsignacionSeguimiento;
};

export type AsignacionExternaCandidata = {
  solicitudExternaId: number;
  alumnoId: number;
  alumnoNombre: string;
  fuente: SolicitudExternaFuente;
  idExterno: string;
  titulo: string;
  empresaNombre: string | null;
  localidad: string | null;
  region: string | null;
  urlAplicacion: string;
  aceptadaEn: string;
};

export type AsignacionExternaCreatePayload = {
  solicitudExternaId: number;
  observaciones?: string;
  horasTotales?: number;
  fechaInicio?: string;
  horasDiariasEstimadas?: number;
  remunerada?: boolean;
  importeMensual?: number | null;
  observacionesRetribucion?: string;
};
