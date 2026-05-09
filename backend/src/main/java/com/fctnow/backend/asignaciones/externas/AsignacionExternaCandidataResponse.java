package com.fctnow.backend.asignaciones.externas;

import com.fctnow.backend.solicitudes.externas.SolicitudExterna;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaFuente;
import java.time.Instant;

public record AsignacionExternaCandidataResponse(
    Long solicitudExternaId,
    Long alumnoId,
    String alumnoNombre,
    SolicitudExternaFuente fuente,
    String idExterno,
    String titulo,
    String empresaNombre,
    String localidad,
    String region,
    String urlAplicacion,
    Instant aceptadaEn) {

  public static AsignacionExternaCandidataResponse from(SolicitudExterna solicitud) {
    return new AsignacionExternaCandidataResponse(
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
        solicitud.getUpdatedAt());
  }
}
