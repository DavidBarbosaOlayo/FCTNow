package com.fctnow.backend.mensajes;

import java.time.Instant;

public record ConversacionResponse(
    Long id,
    String titulo,
    Long otroParticipanteId,
    String otroParticipanteNombre,
    String ultimoMensaje,
    Instant ultimoMensajeAt,
    Instant updatedAt) {

  static ConversacionResponse from(
      Conversacion conversacion,
      Long currentUserId,
      Mensaje ultimoMensaje) {
    var other = conversacion.otherParticipant(currentUserId);
    String title = conversacion.getTitulo() == null
        ? other.getDisplayName()
        : conversacion.getTitulo();
    return new ConversacionResponse(
        conversacion.getId(),
        title,
        other.getId(),
        other.getDisplayName(),
        ultimoMensaje == null ? null : ultimoMensaje.getContenido(),
        ultimoMensaje == null ? null : ultimoMensaje.getCreatedAt(),
        conversacion.getUpdatedAt());
  }
}
