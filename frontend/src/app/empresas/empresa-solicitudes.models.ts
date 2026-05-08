import { OfertaEstado } from '../practicas/ofertas.models';
import { SolicitudEstado } from '../practicas/solicitudes.models';

export type EmpresaSolicitud = {
  id: number;
  estado: SolicitudEstado;
  createdAt: string;
  oferta: {
    id: number;
    titulo: string;
    estado: OfertaEstado;
  };
  alumno: {
    id: number;
    displayName: string;
    email: string;
  };
};
