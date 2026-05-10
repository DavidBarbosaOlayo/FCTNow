package com.fctnow.backend.notificaciones;

import java.time.Instant;

public record NotificacionResponse(
    Long id,
    NotificacionTipo tipo,
    String titulo,
    String mensaje,
    String actionUrl,
    String actionLabel,
    Long ofertaId,
    String ofertaTitulo,
    String ofertaEmpresa,
    String ofertaExternaTitulo,
    String ofertaExternaEmpresa,
    String ofertaExternaUrl,
    String ofertaExternaLocalidad,
    boolean leida,
    Instant createdAt) {

  public static NotificacionResponse from(Notificacion n) {
    return new NotificacionResponse(
        n.getId(),
        n.getTipo(),
        n.getTitulo(),
        n.getMensaje(),
        n.getActionUrl(),
        n.getActionLabel(),
        n.getOferta() == null ? null : n.getOferta().getId(),
        n.getOferta() == null ? null : n.getOferta().getTitulo(),
        n.getOferta() == null ? null : n.getOferta().getEmpresa().getNombre(),
        n.getOfertaExternaTitulo(),
        n.getOfertaExternaEmpresa(),
        n.getOfertaExternaUrl(),
        n.getOfertaExternaLocalidad(),
        n.isLeida(),
        n.getCreatedAt());
  }
}
