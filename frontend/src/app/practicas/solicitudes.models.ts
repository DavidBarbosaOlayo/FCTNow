export type SolicitudEstado = 'SOLICITADA' | 'ACEPTADA' | 'RECHAZADA';

export type SolicitudFct = {
  id: number;
  ofertaId: number;
  ofertaTitulo: string;
  empresaNombre: string;
  estado: SolicitudEstado;
  createdAt: string;
  asignadaPorCentro: boolean;
  fechaAsignacion: string | null;
};
