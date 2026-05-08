package com.fctnow.backend.asignaciones;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AsignacionCreateRequest(
    @NotNull Long solicitudId,
    @Size(max = 2000) String observaciones) {
}
