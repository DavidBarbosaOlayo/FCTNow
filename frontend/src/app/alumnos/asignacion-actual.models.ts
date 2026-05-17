import { AsignacionEstado, AsignacionSeguimiento } from '../asignaciones/asignaciones.models';

export type AlumnoAsignacionOrigen = 'INTERNA' | 'EXTERNA';

export type AlumnoAsignacionActual = {
  id: number;
  origen: AlumnoAsignacionOrigen;
  estado: AsignacionEstado;
  fechaAsignacion: string;
  observaciones: string | null;
  oferta: {
    id: number | null;
    titulo: string;
  };
  empresa: {
    id: number | null;
    nombre: string;
  };
  ubicacion: {
    localidad: string | null;
    region: string | null;
  };
  urlAplicacion: string | null;
  seguimiento: AsignacionSeguimiento;
};
