export type OfertaModalidad = 'PRESENCIAL' | 'HIBRIDA' | 'REMOTA';

export type OfertaEstado =
  | 'BORRADOR'
  | 'PENDIENTE_REVISION'
  | 'PUBLICADA'
  | 'CERRADA'
  | 'RECHAZADA'
  | 'ARCHIVADA';

export type OfertaFct = {
  id: number;
  empresaId: number;
  empresaNombre: string;
  titulo: string;
  descripcion: string;
  familiaProfesional: string;
  cicloFormativo: string | null;
  localidad: string;
  provincia: string;
  modalidad: OfertaModalidad;
  fechaInicio: string;
  fechaFin: string;
  plazas: number;
  requisitos: string | null;
  tareas: string;
  estado: OfertaEstado;
  createdAt: string;
  updatedAt: string;
};

export type OfertaFctFilters = {
  q?: string;
  familiaProfesional?: string;
  localidad?: string;
  modalidad?: OfertaModalidad;
};
