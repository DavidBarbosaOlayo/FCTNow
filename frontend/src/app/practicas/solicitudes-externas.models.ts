export type SolicitudExternaFuente = 'ADZUNA';

export type SolicitudExternaEstado = 'SOLICITADA' | 'ACEPTADA' | 'RECHAZADA' | 'RETIRADA';

export type SolicitudExterna = {
  id: number;
  alumnoId: number;
  alumnoNombre: string;
  fuente: SolicitudExternaFuente;
  idExterno: string;
  titulo: string;
  empresaNombre: string | null;
  localidad: string | null;
  region: string | null;
  urlAplicacion: string;
  publicadoEn: string | null;
  categoria: string | null;
  estado: SolicitudExternaEstado;
  createdAt: string;
  updatedAt: string;
  actualizadoPorId: number;
};

export type SolicitudExternaCreatePayload = {
  fuente: SolicitudExternaFuente;
  idExterno: string;
  titulo: string;
  empresaNombre?: string | null;
  localidad?: string | null;
  region?: string | null;
  urlAplicacion: string;
  publicadoEn?: string | null;
  categoria?: string | null;
};
