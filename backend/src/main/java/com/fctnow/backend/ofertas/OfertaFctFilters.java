package com.fctnow.backend.ofertas;

public record OfertaFctFilters(
    String q,
    String familiaProfesional,
    String localidad,
    OfertaModalidad modalidad) {
}
