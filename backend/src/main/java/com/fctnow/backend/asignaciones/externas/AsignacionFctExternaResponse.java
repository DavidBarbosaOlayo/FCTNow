package com.fctnow.backend.asignaciones.externas;

import com.fctnow.backend.asignaciones.AsignacionEstado;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaFuente;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record AsignacionFctExternaResponse(
    Long id,
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
    AsignacionEstado estado,
    String observaciones,
    Instant fechaAsignacion,
    AsignacionSeguimiento seguimiento) {

  public record AsignacionSeguimiento(
      int horasTotales,
      LocalDate fechaInicio,
      int horasDiariasEstimadas,
      boolean remunerada,
      BigDecimal importeMensual,
      String observacionesRetribucion) {
  }

  public static AsignacionFctExternaResponse from(AsignacionFctExterna asignacion) {
    var solicitud = asignacion.getSolicitud();
    return new AsignacionFctExternaResponse(
        asignacion.getId(),
        solicitud.getId(),
        asignacion.getAlumno().getId(),
        asignacion.getAlumno().getDisplayName(),
        solicitud.getFuente(),
        solicitud.getIdExterno(),
        solicitud.getTitulo(),
        solicitud.getEmpresaNombre(),
        solicitud.getLocalidad(),
        solicitud.getRegion(),
        solicitud.getUrlAplicacion(),
        asignacion.getEstado(),
        asignacion.getObservaciones(),
        asignacion.getFechaAsignacion(),
        new AsignacionSeguimiento(
            asignacion.getHorasTotales(),
            asignacion.getFechaInicio(),
            asignacion.getHorasDiariasEstimadas(),
            asignacion.isRemunerada(),
            asignacion.getImporteMensual(),
            asignacion.getObservacionesRetribucion()));
  }
}
