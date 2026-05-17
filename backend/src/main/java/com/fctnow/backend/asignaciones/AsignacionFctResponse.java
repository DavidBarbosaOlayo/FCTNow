package com.fctnow.backend.asignaciones;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record AsignacionFctResponse(
    Long id,
    AsignacionEstado estado,
    Instant fechaAsignacion,
    String observaciones,
    Long solicitudId,
    AsignacionAlumno alumno,
    AsignacionOferta oferta,
    AsignacionEmpresa empresa,
    AsignacionSeguimiento seguimiento) {

  public record AsignacionAlumno(Long id, String displayName, String email) {
  }

  public record AsignacionOferta(Long id, String titulo) {
  }

  public record AsignacionEmpresa(Long id, String nombre) {
  }

  public record AsignacionSeguimiento(
      int horasTotales,
      LocalDate fechaInicio,
      int horasDiariasEstimadas,
      boolean remunerada,
      BigDecimal importeMensual,
      String observacionesRetribucion) {
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
            asignacion.getEmpresa().getNombre()),
        new AsignacionSeguimiento(
            asignacion.getHorasTotales(),
            asignacion.getFechaInicio(),
            asignacion.getHorasDiariasEstimadas(),
            asignacion.isRemunerada(),
            asignacion.getImporteMensual(),
            asignacion.getObservacionesRetribucion()));
  }
}
