package com.fctnow.backend.ofertas;

import java.time.Instant;
import java.time.LocalDate;

public record OfertaFctResponse(
    Long id,
    Long empresaId,
    String empresaNombre,
    String titulo,
    String descripcion,
    String familiaProfesional,
    String cicloFormativo,
    String localidad,
    String provincia,
    OfertaModalidad modalidad,
    LocalDate fechaInicio,
    LocalDate fechaFin,
    Integer plazas,
    String requisitos,
    String tareas,
    OfertaEstado estado,
    Instant createdAt,
    Instant updatedAt) {

  static OfertaFctResponse from(OfertaFct oferta) {
    return new OfertaFctResponse(
        oferta.getId(),
        oferta.getEmpresa().getId(),
        oferta.getEmpresa().getNombre(),
        oferta.getTitulo(),
        oferta.getDescripcion(),
        oferta.getFamiliaProfesional(),
        oferta.getCicloFormativo(),
        oferta.getLocalidad(),
        oferta.getProvincia(),
        oferta.getModalidad(),
        oferta.getFechaInicio(),
        oferta.getFechaFin(),
        oferta.getPlazas(),
        oferta.getRequisitos(),
        oferta.getTareas(),
        oferta.getEstado(),
        oferta.getCreatedAt(),
        oferta.getUpdatedAt());
  }
}
