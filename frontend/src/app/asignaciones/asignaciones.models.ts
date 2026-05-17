export type AsignacionEstado = 'ACTIVA' | 'FINALIZADA';

export type AsignacionSeguimiento = {
  horasTotales: number;
  fechaInicio: string;
  horasDiariasEstimadas: number;
  remunerada: boolean;
  importeMensual: number | null;
  observacionesRetribucion: string | null;
};

export type AsignacionFct = {
  id: number;
  estado: AsignacionEstado;
  fechaAsignacion: string;
  observaciones: string | null;
  solicitudId: number;
  alumno: {
    id: number;
    displayName: string;
    email: string;
  };
  oferta: {
    id: number;
    titulo: string;
  };
  empresa: {
    id: number;
    nombre: string;
  };
  seguimiento?: AsignacionSeguimiento;
};

export type AsignacionCreatePayload = {
  solicitudId: number;
  observaciones?: string;
  horasTotales?: number;
  fechaInicio?: string;
  horasDiariasEstimadas?: number;
  remunerada?: boolean;
  importeMensual?: number | null;
  observacionesRetribucion?: string;
};

export type AsignacionCandidata = {
  solicitudId: number;
  solicitadaEn: string;
  alumno: {
    id: number;
    displayName: string;
    email: string;
  };
  oferta: {
    id: number;
    titulo: string;
  };
  empresa: {
    id: number;
    nombre: string;
  };
};
