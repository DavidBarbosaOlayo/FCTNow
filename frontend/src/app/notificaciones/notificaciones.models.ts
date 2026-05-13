export type NotificacionTipo =
  | 'RECOMENDACION'
  | 'SOLICITUD_RECIBIDA'
  | 'SOLICITUD_ACEPTADA'
  | 'SOLICITUD_RECHAZADA'
  | 'SOLICITUD_ACEPTADA_PENDIENTE_ASIGNACION'
  | 'ASIGNACION_CREADA'
  | 'OFERTA_PUBLICADA'
  | 'OFERTA_MODIFICADA'
  | 'DOCUMENTACION_PENDIENTE'
  | 'SEGUIMIENTO_PENDIENTE'
  | 'EVALUACION_PENDIENTE'
  | 'INCIDENCIA_REGISTRADA';

export type RecomendacionRequest = {
  alumnoId: number;
  ofertaId?: number;
  ofertaExterna?: {
    titulo: string;
    empresa: string | null;
    url: string;
    localidad: string | null;
  };
};

export type Notificacion = {
  id: number;
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  ofertaId: number | null;
  ofertaTitulo: string | null;
  ofertaEmpresa: string | null;
  ofertaExternaTitulo: string | null;
  ofertaExternaEmpresa: string | null;
  ofertaExternaUrl: string | null;
  ofertaExternaLocalidad: string | null;
  leida: boolean;
  createdAt: string;
};
