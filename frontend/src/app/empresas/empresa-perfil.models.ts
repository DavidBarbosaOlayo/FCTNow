export type IdentificadorFiscalTipo = 'CIF' | 'NIF' | 'NIE';

export type EmpresaEstado = 'ACTIVA' | 'INACTIVA' | 'PENDIENTE_REVISION' | 'RECHAZADA';

export type EmpresaPerfil = {
  id: number;
  nombre: string;
  tipoIdentificadorFiscal: IdentificadorFiscalTipo;
  identificadorFiscal: string;
  sector: string;
  descripcion: string | null;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  emailContacto: string;
  telefonoContacto: string | null;
  personaContacto: string;
  estado: EmpresaEstado;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EmpresaPerfilRequest = {
  nombre: string;
  tipoIdentificadorFiscal: IdentificadorFiscalTipo;
  identificadorFiscal: string;
  sector: string;
  descripcion: string | null;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  emailContacto: string;
  telefonoContacto: string | null;
  personaContacto: string;
};
