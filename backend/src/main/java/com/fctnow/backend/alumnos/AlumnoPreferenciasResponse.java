package com.fctnow.backend.alumnos;

import com.fctnow.backend.ofertas.OfertaModalidad;
import java.time.Instant;
import java.time.LocalDate;

public record AlumnoPreferenciasResponse(
    String familiaProfesional,
    String cicloFormativo,
    String localidadPreferida,
    OfertaModalidad modalidadPreferida,
    LocalDate fechaDisponibilidad,
    String observaciones,
    boolean hasCv,
    String cvFileName,
    String cvContentType,
    Long cvSize,
    Instant cvUpdatedAt) {

  static AlumnoPreferenciasResponse empty() {
    return new AlumnoPreferenciasResponse(null, null, null, null, null, null, false, null, null, null, null);
  }

  static AlumnoPreferenciasResponse from(AlumnoPreferencias preferencias) {
    return new AlumnoPreferenciasResponse(
        preferencias.getFamiliaProfesional(),
        preferencias.getCicloFormativo(),
        preferencias.getLocalidadPreferida(),
        preferencias.getModalidadPreferida(),
        preferencias.getFechaDisponibilidad(),
        preferencias.getObservaciones(),
        preferencias.getCvContent() != null,
        preferencias.getCvFileName(),
        preferencias.getCvContentType(),
        preferencias.getCvSize(),
        preferencias.getCvUpdatedAt());
  }
}
