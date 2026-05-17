package com.fctnow.backend.solicitudes;

import com.fctnow.backend.asignaciones.AsignacionFct;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SolicitudFctResponse(
    Long id,
    Long ofertaId,
    String ofertaTitulo,
    String empresaNombre,
    SolicitudEstado estado,
    Instant createdAt,
    boolean asignadaPorCentro,
    Instant fechaAsignacion,
    AsignacionDetalle asignacion) {

  public record AsignacionDetalle(
      Long id,
      Instant fechaAsignacion,
      int horasTotales,
      LocalDate fechaInicio,
      int horasDiariasEstimadas,
      boolean remunerada,
      BigDecimal importeMensual,
      String observacionesRetribucion) {
  }

  static SolicitudFctResponse from(SolicitudFct solicitud) {
    return from(solicitud, null);
  }

  static SolicitudFctResponse from(SolicitudFct solicitud, AsignacionFct asignacion) {
    AsignacionDetalle detalle = asignacion == null
        ? null
        : new AsignacionDetalle(
            asignacion.getId(),
            asignacion.getFechaAsignacion(),
            asignacion.getHorasTotales(),
            asignacion.getFechaInicio(),
            asignacion.getHorasDiariasEstimadas(),
            asignacion.isRemunerada(),
            asignacion.getImporteMensual(),
            asignacion.getObservacionesRetribucion());
    return new SolicitudFctResponse(
        solicitud.getId(),
        solicitud.getOferta().getId(),
        solicitud.getOferta().getTitulo(),
        solicitud.getOferta().getEmpresa().getNombre(),
        solicitud.getEstado(),
        solicitud.getCreatedAt(),
        asignacion != null,
        asignacion == null ? null : asignacion.getFechaAsignacion(),
        detalle);
  }
}
