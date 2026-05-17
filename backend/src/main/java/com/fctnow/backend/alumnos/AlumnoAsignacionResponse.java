package com.fctnow.backend.alumnos;

import com.fctnow.backend.asignaciones.AsignacionEstado;
import com.fctnow.backend.asignaciones.AsignacionFct;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExterna;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record AlumnoAsignacionResponse(
    Long id,
    AlumnoAsignacionOrigen origen,
    AsignacionEstado estado,
    Instant fechaAsignacion,
    String observaciones,
    AlumnoAsignacionOferta oferta,
    AlumnoAsignacionEmpresa empresa,
    AlumnoAsignacionUbicacion ubicacion,
    String urlAplicacion,
    AlumnoAsignacionSeguimiento seguimiento) {

  public enum AlumnoAsignacionOrigen {
    INTERNA,
    EXTERNA
  }

  public record AlumnoAsignacionOferta(Long id, String titulo) {
  }

  public record AlumnoAsignacionEmpresa(Long id, String nombre) {
  }

  public record AlumnoAsignacionUbicacion(String localidad, String region) {
  }

  public record AlumnoAsignacionSeguimiento(
      int horasTotales,
      LocalDate fechaInicio,
      int horasDiariasEstimadas,
      boolean remunerada,
      BigDecimal importeMensual,
      String observacionesRetribucion) {
  }

  static AlumnoAsignacionResponse from(AsignacionFct asignacion) {
    return new AlumnoAsignacionResponse(
        asignacion.getId(),
        AlumnoAsignacionOrigen.INTERNA,
        asignacion.getEstado(),
        asignacion.getFechaAsignacion(),
        asignacion.getObservaciones(),
        new AlumnoAsignacionOferta(
            asignacion.getOferta().getId(),
            asignacion.getOferta().getTitulo()),
        new AlumnoAsignacionEmpresa(
            asignacion.getEmpresa().getId(),
            asignacion.getEmpresa().getNombre()),
        new AlumnoAsignacionUbicacion(
            asignacion.getOferta().getLocalidad(),
            asignacion.getOferta().getProvincia()),
        "/practicas/" + asignacion.getOferta().getId(),
        seguimiento(
            asignacion.getHorasTotales(),
            asignacion.getFechaInicio(),
            asignacion.getHorasDiariasEstimadas(),
            asignacion.isRemunerada(),
            asignacion.getImporteMensual(),
            asignacion.getObservacionesRetribucion()));
  }

  static AlumnoAsignacionResponse from(AsignacionFctExterna asignacion) {
    var solicitud = asignacion.getSolicitud();
    return new AlumnoAsignacionResponse(
        asignacion.getId(),
        AlumnoAsignacionOrigen.EXTERNA,
        asignacion.getEstado(),
        asignacion.getFechaAsignacion(),
        asignacion.getObservaciones(),
        new AlumnoAsignacionOferta(null, solicitud.getTitulo()),
        new AlumnoAsignacionEmpresa(null, empresaNombre(solicitud.getEmpresaNombre())),
        new AlumnoAsignacionUbicacion(solicitud.getLocalidad(), solicitud.getRegion()),
        solicitud.getUrlAplicacion(),
        seguimiento(
            asignacion.getHorasTotales(),
            asignacion.getFechaInicio(),
            asignacion.getHorasDiariasEstimadas(),
            asignacion.isRemunerada(),
            asignacion.getImporteMensual(),
            asignacion.getObservacionesRetribucion()));
  }

  private static AlumnoAsignacionSeguimiento seguimiento(
      int horasTotales,
      LocalDate fechaInicio,
      int horasDiariasEstimadas,
      boolean remunerada,
      BigDecimal importeMensual,
      String observacionesRetribucion) {
    return new AlumnoAsignacionSeguimiento(
        horasTotales,
        fechaInicio,
        horasDiariasEstimadas,
        remunerada,
        importeMensual,
        observacionesRetribucion);
  }

  private static String empresaNombre(String value) {
    return value == null || value.isBlank() ? "Empresa externa" : value;
  }
}
