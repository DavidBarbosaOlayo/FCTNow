import { OfertaEstado, OfertaModalidad } from '../practicas/ofertas.models';

export type OfertaFctRequest = {
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
};

export type OfertaEstadoChange = {
  estado: OfertaEstado;
};
