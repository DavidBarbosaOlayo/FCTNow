package com.fctnow.backend.solicitudes;

import java.time.Instant;

public record SolicitudFctResponse(
    Long id,
    Long ofertaId,
    String ofertaTitulo,
    String empresaNombre,
    SolicitudEstado estado,
    Instant createdAt) {

  static SolicitudFctResponse from(SolicitudFct solicitud) {
    return new SolicitudFctResponse(
        solicitud.getId(),
        solicitud.getOferta().getId(),
        solicitud.getOferta().getTitulo(),
        solicitud.getOferta().getEmpresa().getNombre(),
        solicitud.getEstado(),
        solicitud.getCreatedAt());
  }
}
