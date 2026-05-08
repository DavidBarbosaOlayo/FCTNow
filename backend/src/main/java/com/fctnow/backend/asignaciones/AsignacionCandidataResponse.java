package com.fctnow.backend.asignaciones;

import com.fctnow.backend.solicitudes.SolicitudFct;
import java.time.Instant;

public record AsignacionCandidataResponse(
    Long solicitudId,
    Instant solicitadaEn,
    AsignacionFctResponse.AsignacionAlumno alumno,
    AsignacionFctResponse.AsignacionOferta oferta,
    AsignacionFctResponse.AsignacionEmpresa empresa) {

  static AsignacionCandidataResponse from(SolicitudFct solicitud) {
    return new AsignacionCandidataResponse(
        solicitud.getId(),
        solicitud.getCreatedAt(),
        new AsignacionFctResponse.AsignacionAlumno(
            solicitud.getAlumno().getId(),
            solicitud.getAlumno().getDisplayName(),
            solicitud.getAlumno().getEmail()),
        new AsignacionFctResponse.AsignacionOferta(
            solicitud.getOferta().getId(),
            solicitud.getOferta().getTitulo()),
        new AsignacionFctResponse.AsignacionEmpresa(
            solicitud.getOferta().getEmpresa().getId(),
            solicitud.getOferta().getEmpresa().getNombre()));
  }
}
