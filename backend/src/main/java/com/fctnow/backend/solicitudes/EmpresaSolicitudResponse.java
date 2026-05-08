package com.fctnow.backend.solicitudes;

import com.fctnow.backend.ofertas.OfertaEstado;
import java.time.Instant;

public record EmpresaSolicitudResponse(
    Long id,
    SolicitudEstado estado,
    Instant createdAt,
    EmpresaSolicitudOferta oferta,
    EmpresaSolicitudAlumno alumno) {

  public record EmpresaSolicitudOferta(Long id, String titulo, OfertaEstado estado) {
  }

  public record EmpresaSolicitudAlumno(Long id, String displayName, String email) {
  }

  static EmpresaSolicitudResponse from(SolicitudFct solicitud) {
    return new EmpresaSolicitudResponse(
        solicitud.getId(),
        solicitud.getEstado(),
        solicitud.getCreatedAt(),
        new EmpresaSolicitudOferta(
            solicitud.getOferta().getId(),
            solicitud.getOferta().getTitulo(),
            solicitud.getOferta().getEstado()),
        new EmpresaSolicitudAlumno(
            solicitud.getAlumno().getId(),
            solicitud.getAlumno().getDisplayName(),
            solicitud.getAlumno().getEmail()));
  }
}
