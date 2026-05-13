export type Conversacion = {
  id: number;
  titulo: string;
  otroParticipanteId: number;
  otroParticipanteNombre: string;
  otroParticipantePhotoDataUrl: string | null;
  ultimoMensaje: string | null;
  ultimoMensajeAt: string | null;
  ultimoMensajePropio: boolean | null;
  updatedAt: string;
};

export type Mensaje = {
  id: number;
  remitenteId: number;
  remitenteNombre: string;
  remitentePhotoDataUrl: string | null;
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
  photoDataUrl: string | null;
};

export type ConversacionCreateRequest = {
  contactoId: number;
};
