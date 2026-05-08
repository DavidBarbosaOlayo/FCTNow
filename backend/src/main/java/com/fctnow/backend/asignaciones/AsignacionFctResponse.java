package com.fctnow.backend.asignaciones;

import java.time.Instant;

public record AsignacionFctResponse(
    Long id,
    AsignacionEstado estado,
    Instant fechaAsignacion,
    String observaciones,
    Long solicitudId,
    AsignacionAlumno alumno,
    AsignacionOferta oferta,
    AsignacionEmpresa empresa) {

  public record AsignacionAlumno(Long id, String displayName, String email) {
  }

  public record AsignacionOferta(Long id, String titulo) {
  }

  public record AsignacionEmpresa(Long id, String nombre) {
  }

  static AsignacionFctResponse from(AsignacionFct asignacion) {
    return new AsignacionFctResponse(
        asignacion.getId(),
        asignacion.getEstado(),
        asignacion.getFechaAsignacion(),
        asignacion.getObservaciones(),
        asignacion.getSolicitud().getId(),
        new AsignacionAlumno(
            asignacion.getAlumno().getId(),
            asignacion.getAlumno().getDisplayName(),
            asignacion.getAlumno().getEmail()),
        new AsignacionOferta(
            asignacion.getOferta().getId(),
            asignacion.getOferta().getTitulo()),
        new AsignacionEmpresa(
            asignacion.getEmpresa().getId(),
            asignacion.getEmpresa().getNombre()));
  }
}
