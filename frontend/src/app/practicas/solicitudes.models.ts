export type SolicitudEstado = 'SOLICITADA';

export type SolicitudFct = {
  id: number;
  ofertaId: number;
  ofertaTitulo: string;
  empresaNombre: string;
  estado: SolicitudEstado;
  createdAt: string;
};
