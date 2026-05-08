package com.fctnow.backend.solicitudes;

import java.time.Instant;

public record SolicitudFctResponse(
    Long id,
    Long ofertaId,
    String ofertaTitulo,
    String empresaNombre,
    SolicitudEstado estado,
    Instant createdAt,
    boolean asignadaPorCentro,
    Instant fechaAsignacion) {

  static SolicitudFctResponse from(SolicitudFct solicitud) {
    return from(solicitud, null);
  }

  static SolicitudFctResponse from(SolicitudFct solicitud, Instant fechaAsignacion) {
    return new SolicitudFctResponse(
        solicitud.getId(),
        solicitud.getOferta().getId(),
        solicitud.getOferta().getTitulo(),
        solicitud.getOferta().getEmpresa().getNombre(),
        solicitud.getEstado(),
        solicitud.getCreatedAt(),
        fechaAsignacion != null,
        fechaAsignacion);
  }
}
