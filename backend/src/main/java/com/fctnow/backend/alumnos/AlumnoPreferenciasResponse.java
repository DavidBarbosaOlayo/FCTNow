package com.fctnow.backend.alumnos;

import com.fctnow.backend.ofertas.OfertaModalidad;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;

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
    Instant cvUpdatedAt,
    boolean hasPhoto,
    String photoDataUrl,
    String photoContentType,
    Long photoSize,
    Instant photoUpdatedAt) {

  static AlumnoPreferenciasResponse empty() {
    return new AlumnoPreferenciasResponse(
        null, null, null, null, null, null, false, null, null, null, null, false, null, null, null, null);
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
        preferencias.getCvUpdatedAt(),
        preferencias.getFotoContent() != null,
        photoDataUrl(preferencias),
        preferencias.getFotoContentType(),
        preferencias.getFotoSize(),
        preferencias.getFotoUpdatedAt());
  }

  public static String photoDataUrl(AlumnoPreferencias preferencias) {
    if (preferencias == null || preferencias.getFotoContent() == null || preferencias.getFotoContentType() == null) {
      return null;
    }
    return "data:%s;base64,%s".formatted(
        preferencias.getFotoContentType(),
        Base64.getEncoder().encodeToString(preferencias.getFotoContent()));
  }
}
