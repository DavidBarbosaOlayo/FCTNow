package com.fctnow.backend.asignaciones.externas;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AsignacionExternaCreateRequest(
    @NotNull Long solicitudExternaId,
    @Size(max = 2000) String observaciones) {}
