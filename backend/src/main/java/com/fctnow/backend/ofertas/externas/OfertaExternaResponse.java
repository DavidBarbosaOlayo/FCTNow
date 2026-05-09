package com.fctnow.backend.ofertas.externas;

import java.time.Instant;

public record OfertaExternaResponse(
    String id,
    String fuente,
    String titulo,
    String empresaNombre,
    String localidad,
    String region,
    String descripcion,
    String categoria,
    String contratoTipo,
    String jornada,
    Double salarioMinimo,
    Double salarioMaximo,
    Boolean salarioEstimado,
    Instant publicadoEn,
    String urlAplicacion) {}
