package com.fctnow.backend.mensajes;

import java.time.Instant;

public record MensajeResponse(
    Long id,
    Long remitenteId,
    String remitenteNombre,
    String contenido,
    boolean propio,
    Instant createdAt) {

  static MensajeResponse from(Mensaje mensaje, Long currentUserId) {
    return new MensajeResponse(
        mensaje.getId(),
        mensaje.getRemitente().getId(),
        mensaje.getRemitente().getDisplayName(),
        mensaje.getContenido(),
        mensaje.getRemitente().getId().equals(currentUserId),
        mensaje.getCreatedAt());
  }
}
