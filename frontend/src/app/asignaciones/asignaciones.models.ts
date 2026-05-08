export type AsignacionEstado = 'ACTIVA' | 'FINALIZADA';

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
};

export type AsignacionCreatePayload = {
  solicitudId: number;
  observaciones?: string;
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
