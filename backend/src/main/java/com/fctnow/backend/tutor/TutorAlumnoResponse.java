package com.fctnow.backend.tutor;

import com.fctnow.backend.asignaciones.AsignacionEstado;
import java.time.Instant;
import java.time.LocalDate;

public record TutorAlumnoResponse(
    Long id,
    String email,
    String centroEmail,
    String displayName,
    boolean enabled,
    String photoDataUrl,
    boolean hasCv,
    String cvFileName,
    String cvContentType,
    Long cvSize,
    Instant cvUpdatedAt,
    Preferencias preferencias,
    SolicitudesResumen solicitudes,
    AsignacionActual asignacionActual,
    AsignacionPendiente asignacionPendiente) {

  public record Preferencias(
      String familiaProfesional,
      String cicloFormativo,
      String localidad,
      String modalidad,
      LocalDate fechaDisponibilidad,
      String observaciones) {
  }

  public record SolicitudesResumen(
      int total,
      int solicitadas,
      int aceptadas,
      int rechazadas) {
  }

  public record AsignacionActual(
      Long id,
      AsignacionEstado estado,
      Instant fechaAsignacion,
      String oferta,
      String empresa,
      String observaciones) {
  }

  public record AsignacionPendiente(
      String tipo,
      Long solicitudId,
      Instant aceptadaEn,
      String oferta,
      String empresa,
      String localidad,
      String urlAplicacion) {
  }
}
