export type Conversacion = {
  id: number;
  titulo: string;
  otroParticipanteId: number;
  otroParticipanteNombre: string;
  ultimoMensaje: string | null;
  ultimoMensajeAt: string | null;
  updatedAt: string;
};

export type Mensaje = {
  id: number;
  remitenteId: number;
  remitenteNombre: string;
  contenido: string;
  propio: boolean;
  createdAt: string;
};

export type MensajeRequest = {
  contenido: string;
};

export type ContactoMensaje = {
  id: number;
  displayName: string;
  familiaProfesional: string | null;
  cicloFormativo: string | null;
};

export type ConversacionCreateRequest = {
  contactoId: number;
};
