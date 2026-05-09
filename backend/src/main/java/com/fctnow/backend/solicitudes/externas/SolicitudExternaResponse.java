package com.fctnow.backend.solicitudes.externas;

import java.time.Instant;

public record SolicitudExternaResponse(
    Long id,
    Long alumnoId,
    String alumnoNombre,
    SolicitudExternaFuente fuente,
    String idExterno,
    String titulo,
    String empresaNombre,
    String localidad,
    String region,
    String urlAplicacion,
    Instant publicadoEn,
    String categoria,
    SolicitudExternaEstado estado,
    Instant createdAt,
    Instant updatedAt,
    Long actualizadoPorId) {

  public static SolicitudExternaResponse from(SolicitudExterna solicitud) {
    return new SolicitudExternaResponse(
        solicitud.getId(),
        solicitud.getAlumno().getId(),
        solicitud.getAlumno().getDisplayName(),
        solicitud.getFuente(),
        solicitud.getIdExterno(),
        solicitud.getTitulo(),
        solicitud.getEmpresaNombre(),
        solicitud.getLocalidad(),
        solicitud.getRegion(),
        solicitud.getUrlAplicacion(),
        solicitud.getPublicadoEn(),
        solicitud.getCategoria(),
        solicitud.getEstado(),
        solicitud.getCreatedAt(),
        solicitud.getUpdatedAt(),
        solicitud.getActualizadoPor().getId());
  }
}
