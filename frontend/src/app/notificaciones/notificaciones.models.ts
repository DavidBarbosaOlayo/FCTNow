export type NotificacionTipo = 'RECOMENDACION';

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
