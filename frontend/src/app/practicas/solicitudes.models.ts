export type SolicitudEstado = 'SOLICITADA' | 'ACEPTADA' | 'RECHAZADA';

export type SolicitudAsignacionDetalle = {
  id: number;
  fechaAsignacion: string;
  horasTotales: number;
  fechaInicio: string;
  horasDiariasEstimadas: number;
  remunerada: boolean;
  importeMensual: number | null;
  observacionesRetribucion: string | null;
};

export type SolicitudFct = {
  id: number;
  ofertaId: number;
  ofertaTitulo: string;
  empresaNombre: string;
  estado: SolicitudEstado;
  createdAt: string;
  asignadaPorCentro: boolean;
  fechaAsignacion: string | null;
  asignacion?: SolicitudAsignacionDetalle | null;
};
