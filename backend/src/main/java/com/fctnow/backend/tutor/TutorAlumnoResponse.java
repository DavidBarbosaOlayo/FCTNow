package com.fctnow.backend.tutor;

import com.fctnow.backend.asignaciones.AsignacionEstado;
import java.time.Instant;
import java.time.LocalDate;

public record TutorAlumnoResponse(
    Long id,
    String email,
    String displayName,
    boolean enabled,
    Preferencias preferencias,
    SolicitudesResumen solicitudes,
    AsignacionActual asignacionActual) {

  public record Preferencias(
      String familiaProfesional,
      String cicloFormativo,
      String localidad,
      String modalidad,
      LocalDate fechaDisponibilidad) {
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
}
