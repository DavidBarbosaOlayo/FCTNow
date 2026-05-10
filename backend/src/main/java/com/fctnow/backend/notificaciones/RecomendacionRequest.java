package com.fctnow.backend.notificaciones;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RecomendacionRequest(
    @NotNull Long alumnoId,
    Long ofertaId,
    @Valid OfertaExterna ofertaExterna) {

  public record OfertaExterna(
      @NotNull @Size(max = 500) String titulo,
      @Size(max = 500) String empresa,
      @NotNull @Size(max = 2000) String url,
      @Size(max = 255) String localidad) {
  }
}
